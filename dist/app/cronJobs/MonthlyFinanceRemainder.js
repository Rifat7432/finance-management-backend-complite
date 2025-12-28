"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const mongoose_1 = __importDefault(require("mongoose"));
const date_fns_1 = require("date-fns");
const user_model_1 = require("../modules/user/user.model");
const income_model_1 = require("../modules/income/income.model");
const expense_model_1 = require("../modules/expense/expense.model");
const budget_model_1 = require("../modules/budget/budget.model");
const emailTemplate_1 = require("../../shared/emailTemplate");
const emailHelper_1 = require("../../helpers/emailHelper");
// ========================================================
// === Finance Reminder Logic =============================
// ========================================================
const scheduleMonthlyFinanceReminderJob = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const now = new Date();
    const start = (0, date_fns_1.startOfMonth)(now);
    const end = (0, date_fns_1.endOfMonth)(now);
    const monthName = (0, date_fns_1.format)(now, 'MMMM yyyy');
    console.log(`📆 Running monthly finance reminder for ${monthName}`);
    // 1️⃣ Fetch all active users
    const users = yield user_model_1.User.find({ isDeleted: false, status: 'active' });
    if (!users.length)
        return console.log('No active users found.');
    // 2️⃣ For each user, compute totals
    for (const user of users) {
        const userId = new mongoose_1.default.Types.ObjectId(user._id);
        // --- income ---
        const incomeAgg = yield income_model_1.Income.aggregate([
            {
                $match: {
                    userId,
                    isDeleted: false,
                    createdAt: { $gte: start, $lte: end },
                },
            },
            { $group: { _id: null, totalIncome: { $sum: '$amount' } } },
        ]);
        const totalIncome = ((_a = incomeAgg === null || incomeAgg === void 0 ? void 0 : incomeAgg[0]) === null || _a === void 0 ? void 0 : _a.totalIncome) || 0;
        // --- expenses ---
        const expensesAgg = yield expense_model_1.Expense.aggregate([
            {
                $match: {
                    userId,
                    isDeleted: false,
                    createdAt: { $gte: start, $lte: end },
                },
            },
            { $group: { _id: null, totalExpenses: { $sum: '$amount' } } },
        ]);
        const totalExpenses = ((_b = expensesAgg === null || expensesAgg === void 0 ? void 0 : expensesAgg[0]) === null || _b === void 0 ? void 0 : _b.totalExpenses) || 0;
        // --- budgets ---
        const budgetsAgg = yield budget_model_1.Budget.aggregate([
            {
                $match: {
                    userId,
                    isDeleted: false,
                    createdAt: { $gte: start, $lte: end },
                },
            },
            { $group: { _id: null, totalBudget: { $sum: '$amount' } } },
        ]);
        const totalBudget = ((_c = budgetsAgg === null || budgetsAgg === void 0 ? void 0 : budgetsAgg[0]) === null || _c === void 0 ? void 0 : _c.totalBudget) || 0;
        const disposable = totalIncome - totalExpenses;
        // 3️⃣ Send relevant notifications
        const userData = {
            email: user.email,
            name: user.name || 'User',
            income: totalIncome,
            totalBudget,
            totalExpenses,
        };
        // (a) Budget > Income
        if (totalBudget > totalIncome) {
            const emailData = emailTemplate_1.emailTemplate.budgetExceedsIncome(userData);
            yield emailHelper_1.emailHelper.sendEmail(emailData);
        }
        // (b) Expenses > Income
        if (totalExpenses > totalIncome) {
            const emailData = emailTemplate_1.emailTemplate.expensesExceedIncome(userData);
            yield emailHelper_1.emailHelper.sendEmail(emailData);
        }
        // (c) Always send monthly summary
        const summaryEmail = emailTemplate_1.emailTemplate.monthlySummary({
            email: user.email,
            name: user.name || 'User',
            month: monthName,
            income: totalIncome,
            budget: totalBudget,
            expenses: totalExpenses,
            disposable,
        });
        yield emailHelper_1.emailHelper.sendEmail(summaryEmail);
        console.log(`📨 Emails sent for user: ${user.email}`);
    }
    console.log('✅ Monthly Finance Reminder Job Completed.');
});
// ========================================================
// === Cron Scheduler =====================================
// ========================================================
node_cron_1.default.schedule('55 23 28-31 * *', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔄 Running Monthly Finance Reminder automation...');
    try {
        const now = new Date();
        const end = (0, date_fns_1.endOfMonth)(now);
        // Only run on the *actual* last day of month
        if (now.getDate() !== end.getDate())
            return;
        yield scheduleMonthlyFinanceReminderJob();
    }
    catch (err) {
        console.error('❌ Monthly Finance Reminder Scheduler error:', err);
    }
}), { timezone: 'Europe/London' });
