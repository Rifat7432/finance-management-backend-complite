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
// 🔁 Calculate next receive date
const getNextIncomeDate = (date, frequency) => {
    const d = new Date(date);
    if (frequency === 'monthly')
        return (0, date_fns_1.addMonths)(d, 1);
    if (frequency === 'yearly')
        return (0, date_fns_1.addYears)(d, 1);
    return d;
};
// WHY CHANGED: Simplified to just check if dates match (no complex logic)
const isToday = (date) => {
    const today = (0, date_fns_1.startOfDay)(new Date());
    const given = (0, date_fns_1.startOfDay)(new Date(date));
    return today.getTime() === given.getTime();
};
// WHY CHANGED: Run at 00:05 instead of 00:00 to avoid conflicts
node_cron_1.default.schedule('5 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔄 Running income automation...');
    try {
        const today = (0, date_fns_1.startOfDay)(new Date());
        const previousWeekStart = (0, date_fns_1.startOfDay)((0, date_fns_1.subWeeks)(today, 1));
        const previousMonthStart = (0, date_fns_1.startOfDay)((0, date_fns_1.subMonths)(today, 1));
        const previousYearStart = (0, date_fns_1.startOfDay)((0, date_fns_1.subYears)(today, 1));
        // WHY CHANGED: Get ALL recurring incomes, filter by date (simpler query)
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
                // Check if TODAY is the receiveDate
                if (!isToday(income.receiveDate))
                    continue;
                const nextDate = getNextIncomeDate(income.receiveDate, income.frequency);
                // WHY CHANGED: Fixed date mutation bug with setHours
                const nextDayStart = (0, date_fns_1.startOfDay)(nextDate);
                const nextDayEnd = new Date(nextDayStart.getTime() + 24 * 60 * 60 * 1000);
                // Check if next month/year income already exists
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
                // Create new income for next period
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
}));
