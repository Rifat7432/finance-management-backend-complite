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
/** 🌍 Helper to get current UK time */
const nowUK = () => {
    return new Date(new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }));
};
/** Determines whether today matches the creation day based on frequency */
const shouldCreateToday = (createdAtDate, frequency) => {
    const today = nowUK();
    const createdAt = new Date(createdAtDate);
    switch (frequency) {
        case 'weekly':
            return (0, date_fns_1.getDay)(today) === (0, date_fns_1.getDay)(createdAt);
        case 'monthly':
            return (0, date_fns_1.getDate)(today) === (0, date_fns_1.getDate)(createdAt);
        case 'yearly':
            return (0, date_fns_1.getDate)(today) === (0, date_fns_1.getDate)(createdAt) && (0, date_fns_1.getMonth)(today) === (0, date_fns_1.getMonth)(createdAt);
        default:
            return false;
    }
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
/** Cron job: runs every 10 seconds (for testing) in UK time */
node_cron_1.default.schedule('10 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔄 Running recurring expense automation (UK time)...');
    try {
        const today = (0, date_fns_1.startOfDay)(nowUK());
        const startOfToday = today;
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);
        const previousWeekStart = (0, date_fns_1.startOfDay)((0, date_fns_1.subWeeks)(today, 1));
        const previousMonthStart = (0, date_fns_1.startOfDay)((0, date_fns_1.subMonths)(today, 1));
        const previousYearStart = (0, date_fns_1.startOfDay)((0, date_fns_1.subYears)(today, 1));
        const recurringExpenses = yield expense_model_1.Expense.find({
            isDeleted: false,
            $or: [
                { frequency: 'weekly', createdAt: { $gte: previousWeekStart, $lt: today } },
                { frequency: 'monthly', createdAt: { $gte: previousMonthStart, $lt: today } },
                { frequency: 'yearly', createdAt: { $gte: previousYearStart, $lt: today } },
            ],
        }).lean();
        let createdCount = 0;
        let skippedCount = 0;
        for (const expense of recurringExpenses) {
            const { createdAt, frequency, endDate } = expense;
            if (!shouldCreateToday(createdAt, frequency)) {
                skippedCount++;
                continue;
            }
            // Calculate next recurrence
            const nextExpenseDate = (0, date_fns_1.startOfDay)(getNextExpenseDate(createdAt, frequency));
            // Skip if endDate has passed
            if (new Date(endDate) < today || new Date(endDate) < new Date(nextExpenseDate)) {
                skippedCount++;
                continue;
            }
            // Only create if nextExpenseDate is today
            if (!(0, date_fns_1.isSameDay)(nextExpenseDate, today)) {
                skippedCount++;
                continue;
            }
            // Avoid duplicates
            const exists = yield expense_model_1.Expense.exists({
                userId: expense.userId,
                name: expense.name,
                amount: expense.amount,
                frequency: expense.frequency,
                isDeleted: false,
                createdAt: { $gte: startOfToday, $lte: endOfToday },
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
    timezone: 'Europe/London', // 🇬🇧 UK time
});
