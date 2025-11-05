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
const isToday = (date) => {
    const today = (0, date_fns_1.startOfDay)(new Date());
    const given = (0, date_fns_1.startOfDay)(new Date(date));
    return today.getTime() === given.getTime();
};
const getNextExpenseDate = (date, frequency) => {
    const d = new Date(date);
    if (frequency === 'weekly')
        return (0, date_fns_1.addWeeks)(d, 1);
    if (frequency === 'monthly')
        return (0, date_fns_1.addMonths)(d, 1);
    if (frequency === 'yearly')
        return (0, date_fns_1.addYears)(d, 1);
    return d;
};
// WHY CHANGED: Run at 00:10 to avoid conflicts with income cron
node_cron_1.default.schedule('10 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔄 Running expense automation...');
    try {
        // WHY CHANGED: Get ALL recurring expenses, filter by date
        const recurringExpenses = yield expense_model_1.Expense.find({
            frequency: { $in: ['weekly', 'monthly', 'yearly'] },
            isDeleted: false,
        }).lean();
        let created = 0, skipped = 0;
        for (const expense of recurringExpenses) {
            try {
                // Check if TODAY is the endDate
                if (!isToday(expense.endDate))
                    continue;
                const nextDate = getNextExpenseDate(expense.endDate, expense.frequency);
                // WHY CHANGED: Fixed date mutation bug
                const nextDayStart = (0, date_fns_1.startOfDay)(nextDate);
                const nextDayEnd = new Date(nextDayStart.getTime() + 24 * 60 * 60 * 1000);
                // Check if next period expense already exists
                const exists = yield expense_model_1.Expense.exists({
                    name: expense.name,
                    userId: expense.userId,
                    frequency: expense.frequency,
                    isDeleted: false,
                    endDate: { $gte: nextDayStart, $lt: nextDayEnd },
                });
                if (exists) {
                    skipped++;
                    continue;
                }
                // Create new expense for next period
                yield expense_model_1.Expense.create({
                    name: expense.name,
                    amount: expense.amount,
                    endDate: nextDate,
                    frequency: expense.frequency,
                    userId: expense.userId,
                });
                console.log(`✅ Expense: ${expense.name} → ${nextDate.toDateString()}`);
                created++;
            }
            catch (err) {
                console.error(`❌ Error processing expense ${expense.name}:`, err);
            }
        }
        console.log(`📊 Expense: Created ${created} | Skipped ${skipped}`);
    }
    catch (error) {
        console.error('❌ Expense automation error:', error);
    }
}));
