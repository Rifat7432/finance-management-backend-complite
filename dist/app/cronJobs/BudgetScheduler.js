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
const budget_model_1 = require("../modules/budget/budget.model");
const date_fns_1 = require("date-fns");
const dateTimeHelper_1 = require("../../utils/dateTimeHelper");
// ✔ Updated to check using UTC time
const isToday = (date) => {
    const today = (0, dateTimeHelper_1.getStartOfDayUTC)();
    const given = (0, dateTimeHelper_1.getStartOfDayUTC)(new Date(date));
    return today.getTime() === given.getTime();
};
node_cron_1.default.schedule('5 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔄 Running income & budget automation (UTC time)...');
    try {
        const today = (0, dateTimeHelper_1.getStartOfDayUTC)();
        const previousMonthStart = (0, date_fns_1.startOfDay)((0, date_fns_1.subMonths)(today, 1));
        // Recurring incomes
        // Recurring budgets
        const recurringBudgets = yield budget_model_1.Budget.find({
            isDeleted: false,
            frequency: 'monthly',
            createdAt: { $gte: previousMonthStart, $lt: today },
        }).lean();
        let created = 0, skipped = 0;
        // Process incomes
        // Process budgets
        for (const budget of recurringBudgets) {
            try {
                if (!isToday(budget.createdAt))
                    continue;
                const nextDate = (0, date_fns_1.addMonths)(new Date(budget.createdAt), 1);
                const nextDayStart = (0, date_fns_1.startOfDay)(nextDate);
                const nextDayEnd = new Date(nextDayStart.getTime() + 24 * 60 * 60 * 1000);
                const exists = yield budget_model_1.Budget.exists({
                    name: budget.name,
                    userId: budget.userId,
                    frequency: 'monthly',
                    isDeleted: false,
                    createdAt: { $gte: nextDayStart, $lt: nextDayEnd },
                });
                if (exists) {
                    skipped++;
                    continue;
                }
                yield budget_model_1.Budget.create({
                    name: budget.name,
                    amount: budget.amount,
                    type: budget.type,
                    frequency: 'monthly',
                    startDate: nextDate,
                    userId: budget.userId,
                });
                console.log(`✅ Budget: ${budget.name} → ${nextDate.toDateString()}`);
                created++;
            }
            catch (err) {
                console.error(`❌ Error processing budget ${budget.name}:`, err);
            }
        }
        console.log(`📊 Automation: Created ${created} | Skipped ${skipped}`);
    }
    catch (error) {
        console.error('❌ Automation error:', error);
    }
}), {
    timezone: 'UTC',
});
