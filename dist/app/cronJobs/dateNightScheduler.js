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
const dateNight_model_1 = require("../modules/dateNight/dateNight.model");
const date_fns_1 = require("date-fns");
/** 🌍 Helper to get current UK time */
const nowUK = () => {
    return new Date(new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }));
};
// 🔁 Calculate next date night date
const getNextDateNightDate = (date, repeatEvery) => {
    const d = new Date(date);
    if (repeatEvery === 'Daily')
        return (0, date_fns_1.addDays)(d, 1);
    if (repeatEvery === 'Weekly')
        return (0, date_fns_1.addWeeks)(d, 1);
    if (repeatEvery === 'Monthly')
        return (0, date_fns_1.addMonths)(d, 1);
    if (repeatEvery === 'Quarterly')
        return (0, date_fns_1.addMonths)(d, 3);
    if (repeatEvery === 'Yearly')
        return (0, date_fns_1.addYears)(d, 1);
    return d;
};
// Check if it's been at least 1 hour after the date + time (UK time)
const isOneHourPast = (date, time) => {
    const now = nowUK();
    // Combine date and time into a full datetime
    const dateTimeString = time
        ? `${date.toISOString().split('T')[0]}T${time}:00.000Z`
        : date.toISOString();
    const dateNightDateTime = new Date(dateTimeString);
    const oneHourAfter = new Date(dateNightDateTime.getTime() + 60 * 60 * 1000);
    return now >= oneHourAfter;
};
node_cron_1.default.schedule('0 * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔄 Running date night automation (UK time)...');
    try {
        // Get ALL recurring date nights (no date filtering)
        const recurringDateNights = yield dateNight_model_1.DateNight.find({
            isDeleted: false,
            date: { $exists: true },
            repeatEvery: { $in: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'] },
        }).lean();
        let updated = 0, skipped = 0;
        for (const dateNight of recurringDateNights) {
            try {
                if (!isOneHourPast(dateNight.date, dateNight.time)) {
                    skipped++;
                    continue;
                }
                const nextDate = getNextDateNightDate(dateNight.date, dateNight.repeatEvery);
                yield dateNight_model_1.DateNight.updateOne({ _id: dateNight._id }, { $set: { date: nextDate, isRemainderSent: false } });
                console.log(`✅ Date Night Updated: ${dateNight.plan} → ${nextDate.toDateString()} at ${dateNight.time || 'N/A'}`);
                updated++;
            }
            catch (err) {
                console.error(`❌ Error processing date night ${dateNight.plan}:`, err);
            }
        }
        console.log(`📊 Date Night: Updated ${updated} | Skipped ${skipped}`);
    }
    catch (error) {
        console.error('❌ Date night automation error:', error);
    }
}), {
    timezone: 'Europe/London', // 🇬🇧 UK time
});
