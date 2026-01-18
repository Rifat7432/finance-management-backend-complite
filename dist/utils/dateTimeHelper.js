"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatUTCWithLabel = exports.getStartOfDayUTC = exports.combineDateAndTime = exports.hasOneHourPassed = exports.addHoursUTC = exports.addYearsUTC = exports.addMonthsUTC = exports.addWeeksUTC = exports.addDaysUTC = exports.isFuture = exports.isPast = exports.isToday = exports.formatForLog = exports.formatUTC = exports.formatToISO = exports.getEndOfYearUTC = exports.getStartOfYearUTC = exports.getEndOfMonthUTC = exports.getStartOfMonthUTC = exports.getEndOfTodayUTC = exports.getStartOfTodayUTC = exports.toUTC = exports.getCurrentUTC = void 0;
const date_fns_1 = require("date-fns");
// ============================================
// ======= UTC DATETIME HELPER =================
// ============================================
const UTC_TZ = 'UTC';
/**
 * Get current time in UTC
 */
const getCurrentUTC = () => {
    return new Date(); // new Date() is always in UTC internally
};
exports.getCurrentUTC = getCurrentUTC;
/**
 * Convert any date to UTC
 */
const toUTC = (date) => {
    const d = new Date(date);
    if (!(0, date_fns_1.isValid)(d))
        throw new Error(`Invalid date: ${date}`);
    return d; // Already a UTC Date object
};
exports.toUTC = toUTC;
/**
 * Get start of today (UTC)
 */
const getStartOfTodayUTC = () => {
    const now = (0, exports.getCurrentUTC)();
    // Create a date with only year, month, day (at 00:00:00)
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const day = now.getUTCDate();
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
};
exports.getStartOfTodayUTC = getStartOfTodayUTC;
/**
 * Get end of today (UTC)
 */
const getEndOfTodayUTC = () => {
    const now = (0, exports.getCurrentUTC)();
    // Create a date with tomorrow at 00:00:00, then subtract 1ms
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const day = now.getUTCDate();
    const tomorrow = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));
    return new Date(tomorrow.getTime() - 1);
};
exports.getEndOfTodayUTC = getEndOfTodayUTC;
/**
 * Get start of month (UTC)
 */
const getStartOfMonthUTC = (date = (0, exports.getCurrentUTC)()) => {
    const d = (0, exports.toUTC)(date);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    return new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
};
exports.getStartOfMonthUTC = getStartOfMonthUTC;
/**
 * Get end of month (UTC)
 */
const getEndOfMonthUTC = (date = (0, exports.getCurrentUTC)()) => {
    const d = (0, exports.toUTC)(date);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    // First day of next month minus 1ms
    const nextMonth = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
    return new Date(nextMonth.getTime() - 1);
};
exports.getEndOfMonthUTC = getEndOfMonthUTC;
/**
 * Get start of year (UTC)
 */
const getStartOfYearUTC = (date = (0, exports.getCurrentUTC)()) => {
    const d = (0, exports.toUTC)(date);
    const year = d.getUTCFullYear();
    return new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
};
exports.getStartOfYearUTC = getStartOfYearUTC;
/**
 * Get end of year (UTC)
 */
const getEndOfYearUTC = (date = (0, exports.getCurrentUTC)()) => {
    const d = (0, exports.toUTC)(date);
    const year = d.getUTCFullYear();
    // First day of next year minus 1ms
    const nextYear = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
    return new Date(nextYear.getTime() - 1);
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
    const d = (0, exports.toUTC)(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    const seconds = String(d.getUTCSeconds()).padStart(2, '0');
    const ms = String(d.getUTCMilliseconds()).padStart(3, '0');
    return formatStr
        .replace('yyyy', String(year))
        .replace('MM', month)
        .replace('dd', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds)
        .replace('SSS', ms);
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
    const d = (0, exports.toUTC)(date);
    const today = (0, exports.getStartOfTodayUTC)();
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const day = d.getUTCDate();
    const dateStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    return dateStart.getTime() === today.getTime();
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
    return new Date(d.getTime() + hours * 60 * 60 * 1000);
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
 * Example: combineDateAndTime('2026-01-16', '14:30')
 */
const combineDateAndTime = (dateStr, timeStr, timeZone = 'UTC') => {
    const combined = `${dateStr}T${timeStr}:00`;
    const d = new Date(combined);
    if (!(0, date_fns_1.isValid)(d))
        throw new Error(`Invalid date or time: ${dateStr} ${timeStr}`);
    return d;
};
exports.combineDateAndTime = combineDateAndTime;
/**
 * Get start of day for any date (UTC)
 */
const getStartOfDayUTC = (date = (0, exports.getCurrentUTC)()) => {
    const d = (0, exports.toUTC)(date);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const day = d.getUTCDate();
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
};
exports.getStartOfDayUTC = getStartOfDayUTC;
/**
 * Format date for display with UTC label
 */
const formatUTCWithLabel = (date, formatStr = 'yyyy-MM-dd HH:mm:ss') => {
    return (0, exports.formatUTC)(date, formatStr) + ' UTC';
};
exports.formatUTCWithLabel = formatUTCWithLabel;
