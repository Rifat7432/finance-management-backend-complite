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
const expense_model_1 = require("../modules/expense/expense.model");
const date_fns_1 = require("date-fns");
const dateTimeHelper_1 = require("../../utils/dateTimeHelper");
/** Determines whether today matches the creation day based on frequency */
const isToday = (date) => {
    const today = (0, dateTimeHelper_1.getStartOfDayUTC)();
    return today.getTime() === date.getTime();
};
/** Returns the next expense date based on frequency */
const getNextExpenseDate = (fromDate, frequency) => {
    const baseDate = new Date(fromDate);
    switch (frequency) {
        case 'weekly':
            return (0, date_fns_1.addWeeks)(baseDate, 1);
        case 'monthly':
            return (0, date_fns_1.addMonths)(baseDate, 1);
        case 'yearly':
            return (0, date_fns_1.addYears)(baseDate, 1);
        default:
            return baseDate;
    }
};
/** Cron job: runs at 00:10 UTC every day */
node_cron_1.default.schedule('10 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔄 Running recurring expense automation (UTC time)...');
    try {
        const today = (0, dateTimeHelper_1.getStartOfDayUTC)();
        const recurringExpenses = yield expense_model_1.Expense.find({
            isDeleted: false,
            $or: [{ frequency: 'weekly' }, { frequency: 'monthly' }, { frequency: 'yearly' }],
        }).lean();
        let createdCount = 0;
        let skippedCount = 0;
        for (const expense of recurringExpenses) {
            const { frequency, endDate } = expense;
            if (!isToday(endDate)) {
                skippedCount++;
                continue;
            }
            // Calculate next recurrence
            const nextExpenseDate = getNextExpenseDate(endDate, frequency);
            const nextExpenseDateStart = nextExpenseDate;
            const nextExpenseDateEnd = new Date(nextExpenseDate.getTime() + 24 * 60 * 60 * 1000);
            // Avoid duplicates
            const exists = yield expense_model_1.Expense.exists({
                userId: expense.userId,
                name: expense.name,
                amount: expense.amount,
                frequency: expense.frequency,
                isDeleted: false,
                endDate: { $gte: nextExpenseDateStart, $lte: nextExpenseDateEnd },
            });
            if (exists) {
                skippedCount++;
                continue;
            }
            // ✅ Create expense
            yield expense_model_1.Expense.create({
                name: expense.name,
                amount: expense.amount,
                frequency: expense.frequency,
                userId: expense.userId,
                endDate: nextExpenseDate,
            });
            console.log(`✅ Created recurring expense "${expense.name}" for ${nextExpenseDate.toDateString()}`);
            createdCount++;
        }
        console.log(`📊 Recurring Expenses → Created: ${createdCount} | Skipped: ${skippedCount}`);
    }
    catch (error) {
        console.error('❌ Error during expense automation:', error);
    }
}), {
    timezone: 'UTC',
});
