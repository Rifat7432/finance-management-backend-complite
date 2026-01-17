import { toZonedTime } from 'date-fns-tz';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear, 
  startOfDay, 
  format, 
  isValid,
  addDays,
  addMonths,
  addYears,
} from 'date-fns';

// ============================================
// ======= UTC DATETIME HELPER =================
// ============================================

const UTC_TZ = 'UTC';

/**
 * Get current time in UTC
 */
export const getCurrentUTC = (): Date => {
  return toZonedTime(new Date(), UTC_TZ);
};

/**
 * Convert any date to UTC
 */
export const toUTC = (date: Date | string | number): Date => {
  const d = new Date(date);
  if (!isValid(d)) throw new Error(`Invalid date: ${date}`);
  return toZonedTime(d, UTC_TZ);
};

/**
 * Get start of today (UTC)
 */
export const getStartOfTodayUTC = (): Date => {
  return startOfDay(getCurrentUTC());
};

/**
 * Get end of today (UTC)
 */
export const getEndOfTodayUTC = (): Date => {
  const today = getStartOfTodayUTC();
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  return end;
};

/**
 * Get start of month (UTC)
 */
export const getStartOfMonthUTC = (date: Date = getCurrentUTC()): Date => {
  return startOfMonth(toUTC(date));
};

/**
 * Get end of month (UTC)
 */
export const getEndOfMonthUTC = (date: Date = getCurrentUTC()): Date => {
  return endOfMonth(toUTC(date));
};

/**
 * Get start of year (UTC)
 */
export const getStartOfYearUTC = (date: Date = getCurrentUTC()): Date => {
  return startOfYear(toUTC(date));
};

/**
 * Get end of year (UTC)
 */
export const getEndOfYearUTC = (date: Date = getCurrentUTC()): Date => {
  return endOfYear(toUTC(date));
};

/**
 * Format date as ISO string (UTC)
 */
export const formatToISO = (date: Date | string | number): string => {
  return toUTC(date).toISOString();
};

/**
 * Format date for display (UTC)
 */
export const formatUTC = (date: Date | string | number, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string => {
  return format(toUTC(date), formatStr);
};

/**
 * Format date for logging (UTC)
 */
export const formatForLog = (date: Date | string | number): string => {
  return formatUTC(date, 'yyyy-MM-dd HH:mm:ss.SSS');
};

/**
 * Check if date is today (UTC)
 */
export const isToday = (date: Date | string | number): boolean => {
  const d = startOfDay(toUTC(date));
  const today = getStartOfTodayUTC();
  return d.getTime() === today.getTime();
};

/**
 * Check if date is in the past (UTC)
 */
export const isPast = (date: Date | string | number): boolean => {
  return toUTC(date) < getCurrentUTC();
};

/**
 * Check if date is in the future (UTC)
 */
export const isFuture = (date: Date | string | number): boolean => {
  return toUTC(date) > getCurrentUTC();
};

/**
 * Add days to date (UTC)
 */
export const addDaysUTC = (date: Date | string | number, days: number): Date => {
  return addDays(toUTC(date), days);
};

/**
 * Add weeks to date (UTC)
 */
export const addWeeksUTC = (date: Date | string | number, weeks: number): Date => {
  return addDays(toUTC(date), weeks * 7);
};

/**
 * Add months to date (UTC)
 */
export const addMonthsUTC = (date: Date | string | number, months: number): Date => {
  return addMonths(toUTC(date), months);
};

/**
 * Add years to date (UTC)
 */
export const addYearsUTC = (date: Date | string | number, years: number): Date => {
  return addYears(toUTC(date), years);
};

/**
 * Add hours to date (UTC)
 */
export const addHoursUTC = (date: Date | string | number, hours: number): Date => {
  const d = toUTC(date);
  d.setHours(d.getHours() + hours);
  return d;
};

/**
 * Check if one hour has passed since date
 */
export const hasOneHourPassed = (date: Date | string | number): boolean => {
  const d = toUTC(date);
  const oneHourLater = new Date(d.getTime() + 60 * 60 * 1000);
  return getCurrentUTC() >= oneHourLater;
};

/**
 * Convert date with time string to UTC date
 * Example: combineDateAndTime('2024-01-14', '14:30') 
 */
export const combineDateAndTime = (dateStr: string, timeStr: string, timeZone: string = 'UTC'): Date => {
  const combined = `${dateStr}T${timeStr}:00Z`;
  const d = new Date(combined);
  return toZonedTime(d, timeZone);
};

/**
 * Get start of day for any date (UTC)
 */
export const getStartOfDayUTC = (date: Date = getCurrentUTC()): Date => {
  return startOfDay(toUTC(date));
};

/**
 * Format date for display with UTC label
 */
export const formatUTCWithLabel = (date: Date | string | number, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string => {
  return formatUTC(date, formatStr) + ' UTC';
};
