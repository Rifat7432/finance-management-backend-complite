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
const income_model_1 = require("../modules/income/income.model");
const date_fns_1 = require("date-fns");
// 🌍 Get the current UK time
const nowUK = () => {
    return new Date(new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }));
};
// 🔁 Calculate next receive date
const getNextIncomeDate = (date, frequency) => {
    const d = new Date(date);
    if (frequency === 'monthly')
        return (0, date_fns_1.addMonths)(d, 1);
    if (frequency === 'yearly')
        return (0, date_fns_1.addYears)(d, 1);
    return d;
};
// ✔ Updated to check using UK time
const isToday = (date) => {
    const today = (0, date_fns_1.startOfDay)(nowUK());
    const given = (0, date_fns_1.startOfDay)(new Date(date));
    return today.getTime() === given.getTime();
};
// Run every 10 seconds (for testing) – IN UK TIME
node_cron_1.default.schedule('5 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔄 Running income automation (UK time)...');
    try {
        const today = (0, date_fns_1.startOfDay)(nowUK());
        const previousWeekStart = (0, date_fns_1.startOfDay)((0, date_fns_1.subWeeks)(today, 1));
        const previousMonthStart = (0, date_fns_1.startOfDay)((0, date_fns_1.subMonths)(today, 1));
        const previousYearStart = (0, date_fns_1.startOfDay)((0, date_fns_1.subYears)(today, 1));
        // Recurring incomes
        const recurringIncomes = yield income_model_1.Income.find({
            isDeleted: false,
            $or: [
                { frequency: 'monthly', createdAt: { $gte: previousMonthStart, $lt: today } },
                { frequency: 'yearly', createdAt: { $gte: previousYearStart, $lt: today } },
            ],
        }).lean();
        let created = 0, skipped = 0;
        for (const income of recurringIncomes) {
            try {
                // Must be received today (UK date)
                if (!isToday(income.receiveDate))
                    continue;
                const nextDate = getNextIncomeDate(income.receiveDate, income.frequency);
                const nextDayStart = (0, date_fns_1.startOfDay)(nextDate);
                const nextDayEnd = new Date(nextDayStart.getTime() + 24 * 60 * 60 * 1000);
                // Avoid duplicates
                const exists = yield income_model_1.Income.exists({
                    name: income.name,
                    userId: income.userId,
                    frequency: income.frequency,
                    isDeleted: false,
                    receiveDate: { $gte: nextDayStart, $lt: nextDayEnd },
                });
                if (exists) {
                    skipped++;
                    continue;
                }
                // Insert next recurring record
                yield income_model_1.Income.create({
                    name: income.name,
                    amount: income.amount,
                    receiveDate: nextDate,
                    frequency: income.frequency,
                    userId: income.userId,
                });
                console.log(`✅ Income: ${income.name} → ${nextDate.toDateString()}`);
                created++;
            }
            catch (err) {
                console.error(`❌ Error processing income ${income.name}:`, err);
            }
        }
        console.log(`📊 Income: Created ${created} | Skipped ${skipped}`);
    }
    catch (error) {
        console.error('❌ Income automation error:', error);
    }
}), {
    timezone: 'Europe/London', // 🇬🇧 UK local time
});
