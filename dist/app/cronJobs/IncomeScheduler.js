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
const dateTimeHelper_1 = require("../../utils/dateTimeHelper");
/**
 * ✅ FIXED: Checks if a date is today using UTC
 */
const isTodayUTC = (date) => {
    const today = (0, dateTimeHelper_1.getStartOfTodayUTC)();
    const dateStart = (0, dateTimeHelper_1.getStartOfDayUTC)(date);
    return today.getTime() === dateStart.getTime();
};
/**
 * ✅ FIXED: Calculate next receive date using UTC functions
 */
const getNextIncomeDate = (date, frequency) => {
    const d = (0, dateTimeHelper_1.toUTC)(date);
    if (frequency === 'monthly')
        return (0, dateTimeHelper_1.addMonthsUTC)(d, 1);
    if (frequency === 'yearly')
        return (0, dateTimeHelper_1.addYearsUTC)(d, 1);
    return d;
};
/**
 * ✅ Run at 5:00 UTC every day
 */
node_cron_1.default.schedule('0 5 * * *', // 5:00 AM UTC daily
() => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`\n🔄 [${(0, dateTimeHelper_1.formatForLog)((0, dateTimeHelper_1.getCurrentUTC)())}] Income Scheduler started...`);
    try {
        const today = (0, dateTimeHelper_1.getStartOfTodayUTC)();
        console.log(`📅 Today (UTC): ${(0, dateTimeHelper_1.formatUTC)(today)}`);
        // ✅ Get all recurring incomes created before today
        const recurringIncomes = yield income_model_1.Income.find({
            isDeleted: false,
            frequency: { $in: ['monthly', 'yearly'] },
            createdAt: { $lt: today }, // Created before today
        }).lean();
        console.log(`📦 Found ${recurringIncomes.length} recurring incomes\n`);
        let created = 0, skipped = 0;
        for (const income of recurringIncomes) {
            try {
                // ✅ Check if receive date is TODAY (UTC)
                if (!isTodayUTC(income.receiveDate))
                    continue;
                console.log(`⏰ Processing: "${income.name}" (Received: ${(0, dateTimeHelper_1.formatUTC)(income.receiveDate)})`);
                // ✅ Calculate next receive date using UTC
                const nextDate = getNextIncomeDate(income.receiveDate, income.frequency);
                const nextDayStart = (0, dateTimeHelper_1.getStartOfDayUTC)(nextDate);
                const nextDayEnd = (0, dateTimeHelper_1.getEndOfTodayUTC)();
                console.log(`   Next date will be: ${(0, dateTimeHelper_1.formatUTC)(nextDate)}`);
                // ✅ Check for duplicates using UTC date range
                const exists = yield income_model_1.Income.exists({
                    name: income.name,
                    userId: income.userId,
                    frequency: income.frequency,
                    isDeleted: false,
                    receiveDate: { $gte: nextDayStart, $lte: nextDayEnd },
                });
                if (exists) {
                    console.log(`   ⏭️  Skipped: Already exists for next period`);
                    skipped++;
                    continue;
                }
                // ✅ Insert next recurring record
                yield income_model_1.Income.create({
                    name: income.name,
                    amount: income.amount,
                    receiveDate: nextDate,
                    frequency: income.frequency,
                    userId: income.userId,
                });
                console.log(`   ✅ Created: ${income.name} → ${(0, dateTimeHelper_1.formatUTC)(nextDate)}`);
                created++;
            }
            catch (err) {
                console.error(`   ❌ Error processing income ${income.name}:`, err);
            }
        }
        console.log(`\n📊 Summary: ✅ Created ${created} | ⏭️  Skipped ${skipped}\n`);
    }
    catch (error) {
        console.error(`❌ Income automation error [${(0, dateTimeHelper_1.formatForLog)((0, dateTimeHelper_1.getCurrentUTC)())}]:`, error);
    }
}), {
    timezone: 'UTC',
});
