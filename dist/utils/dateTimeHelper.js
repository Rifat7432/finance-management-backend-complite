"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatUTCWithLabel = exports.getStartOfDayUTC = exports.combineDateAndTime = exports.hasOneHourPassed = exports.addHoursUTC = exports.addYearsUTC = exports.addMonthsUTC = exports.addWeeksUTC = exports.addDaysUTC = exports.isFuture = exports.isPast = exports.isToday = exports.formatForLog = exports.formatUTC = exports.formatToISO = exports.getEndOfYearUTC = exports.getStartOfYearUTC = exports.getEndOfMonthUTC = exports.getStartOfMonthUTC = exports.getEndOfTodayUTC = exports.getStartOfTodayUTC = exports.toUTC = exports.getCurrentUTC = void 0;
const date_fns_tz_1 = require("date-fns-tz");
const date_fns_1 = require("date-fns");
// ============================================
// ======= UTC DATETIME HELPER =================
// ============================================
const UTC_TZ = 'UTC';
/**
 * Get current time in UTC
 */
const getCurrentUTC = () => {
    return (0, date_fns_tz_1.toZonedTime)(new Date(), UTC_TZ);
};
exports.getCurrentUTC = getCurrentUTC;
/**
 * Convert any date to UTC
 */
const toUTC = (date) => {
    const dateStr = new Date(date);
    const day = (0, date_fns_1.format)(dateStr, 'dd');
    const monthName = (0, date_fns_1.format)(dateStr, 'MMM');
    const year = (0, date_fns_1.format)(dateStr, 'yyyy');
    const formateDate = `${monthName} ${day}, ${year}`;
    const d = new Date(formateDate);
    if (!(0, date_fns_1.isValid)(d))
        throw new Error(`Invalid date: ${date}`);
    return (0, date_fns_tz_1.toZonedTime)(d, UTC_TZ);
};
exports.toUTC = toUTC;
/**
 * Get start of today (UTC)
 */
const getStartOfTodayUTC = () => {
    return (0, date_fns_1.startOfDay)((0, exports.getCurrentUTC)());
};
exports.getStartOfTodayUTC = getStartOfTodayUTC;
/**
 * Get end of today (UTC)
 */
const getEndOfTodayUTC = () => {
    const today = (0, exports.getStartOfTodayUTC)();
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    return end;
};
exports.getEndOfTodayUTC = getEndOfTodayUTC;
/**
 * Get start of month (UTC)
 */
const getStartOfMonthUTC = (date = (0, exports.getCurrentUTC)()) => {
    return (0, date_fns_1.startOfMonth)((0, exports.toUTC)(date));
};
exports.getStartOfMonthUTC = getStartOfMonthUTC;
/**
 * Get end of month (UTC)
 */
const getEndOfMonthUTC = (date = (0, exports.getCurrentUTC)()) => {
    return (0, date_fns_1.endOfMonth)((0, exports.toUTC)(date));
};
exports.getEndOfMonthUTC = getEndOfMonthUTC;
/**
 * Get start of year (UTC)
 */
const getStartOfYearUTC = (date = (0, exports.getCurrentUTC)()) => {
    return (0, date_fns_1.startOfYear)((0, exports.toUTC)(date));
};
exports.getStartOfYearUTC = getStartOfYearUTC;
/**
 * Get end of year (UTC)
 */
const getEndOfYearUTC = (date = (0, exports.getCurrentUTC)()) => {
    return (0, date_fns_1.endOfYear)((0, exports.toUTC)(date));
};
exports.getEndOfYearUTC = getEndOfYearUTC;
/**
 * Format date as ISO string (UTC)
 */
const formatToISO = (date) => {
    return (0, exports.toUTC)(date).toISOString();
};
exports.formatToISO = formatToISO;
/**
 * Format date for display (UTC)
 */
const formatUTC = (date, formatStr = 'yyyy-MM-dd HH:mm:ss') => {
    return (0, date_fns_1.format)((0, exports.toUTC)(date), formatStr);
};
exports.formatUTC = formatUTC;
/**
 * Format date for logging (UTC)
 */
const formatForLog = (date) => {
    return (0, exports.formatUTC)(date, 'yyyy-MM-dd HH:mm:ss.SSS');
};
exports.formatForLog = formatForLog;
/**
 * Check if date is today (UTC)
 */
const isToday = (date) => {
    const d = (0, date_fns_1.startOfDay)((0, exports.toUTC)(date));
    const today = (0, exports.getStartOfTodayUTC)();
    return d.getTime() === today.getTime();
};
exports.isToday = isToday;
/**
 * Check if date is in the past (UTC)
 */
const isPast = (date) => {
    return (0, exports.toUTC)(date) < (0, exports.getCurrentUTC)();
};
exports.isPast = isPast;
/**
 * Check if date is in the future (UTC)
 */
const isFuture = (date) => {
    return (0, exports.toUTC)(date) > (0, exports.getCurrentUTC)();
};
exports.isFuture = isFuture;
/**
 * Add days to date (UTC)
 */
const addDaysUTC = (date, days) => {
    return (0, date_fns_1.addDays)((0, exports.toUTC)(date), days);
};
exports.addDaysUTC = addDaysUTC;
/**
 * Add weeks to date (UTC)
 */
const addWeeksUTC = (date, weeks) => {
    return (0, date_fns_1.addDays)((0, exports.toUTC)(date), weeks * 7);
};
exports.addWeeksUTC = addWeeksUTC;
/**
 * Add months to date (UTC)
 */
const addMonthsUTC = (date, months) => {
    return (0, date_fns_1.addMonths)((0, exports.toUTC)(date), months);
};
exports.addMonthsUTC = addMonthsUTC;
/**
 * Add years to date (UTC)
 */
const addYearsUTC = (date, years) => {
    return (0, date_fns_1.addYears)((0, exports.toUTC)(date), years);
};
exports.addYearsUTC = addYearsUTC;
/**
 * Add hours to date (UTC)
 */
const addHoursUTC = (date, hours) => {
    const d = (0, exports.toUTC)(date);
    d.setHours(d.getHours() + hours);
    return d;
};
exports.addHoursUTC = addHoursUTC;
/**
 * Check if one hour has passed since date
 */
const hasOneHourPassed = (date) => {
    const d = (0, exports.toUTC)(date);
    const oneHourLater = new Date(d.getTime() + 60 * 60 * 1000);
    return (0, exports.getCurrentUTC)() >= oneHourLater;
};
exports.hasOneHourPassed = hasOneHourPassed;
/**
 * Convert date with time string to UTC date
 * Example: combineDateAndTime('2024-01-14', '14:30')
 */
const combineDateAndTime = (dateStr, timeStr, timeZone = 'UTC') => {
    const combined = `${dateStr}T${timeStr}:00Z`;
    const d = new Date(combined);
    return (0, date_fns_tz_1.toZonedTime)(d, timeZone);
};
exports.combineDateAndTime = combineDateAndTime;
/**
 * Get start of day for any date (UTC)
 */
const getStartOfDayUTC = (date = (0, exports.getCurrentUTC)()) => {
    return (0, exports.toUTC)((0, date_fns_1.startOfDay)(date));
};
exports.getStartOfDayUTC = getStartOfDayUTC;
/**
 * Format date for display with UTC label
 */
const formatUTCWithLabel = (date, formatStr = 'yyyy-MM-dd HH:mm:ss') => {
    return (0, exports.formatUTC)(date, formatStr) + ' UTC';
};
exports.formatUTCWithLabel = formatUTCWithLabel;
