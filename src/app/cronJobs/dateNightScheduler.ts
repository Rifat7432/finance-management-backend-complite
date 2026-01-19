import cron from 'node-cron';
import { DateNight } from '../modules/dateNight/dateNight.model';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { getCurrentUTC, addHoursUTC } from '../../utils/dateTimeHelper';

// 🔁 Calculate next date night date
const getNextDateNightDate = (date: Date, repeatEvery: string): Date => {
     const d = new Date(date);
     if (repeatEvery === 'Daily') return addDays(d, 1);
     if (repeatEvery === 'Weekly') return addWeeks(d, 1);
     if (repeatEvery === 'Monthly') return addMonths(d, 1);
     if (repeatEvery === 'Quarterly') return addMonths(d, 3);
     if (repeatEvery === 'Yearly') return addYears(d, 1);
     return d;
};

// Check if it's been at least 1 hour after the date + time (UTC time)
const isOneHourPast = (date: Date | string): boolean => {
  const now = getCurrentUTC();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const oneHour = 60 * 60 * 1000;
  const twoHours = 2 * oneHour;

  return diffMs >= oneHour && diffMs < twoHours;
};


cron.schedule(
      '0 * * * *',
     async () => {
          console.log('🔄 Running date night automation (UTC time)...');

          try {
               // Get ALL recurring date nights (no date filtering)
               const recurringDateNights = await DateNight.find({
                    isDeleted: false,
                    UTCDate: { $exists: true },
                    repeatEvery: { $in: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'] },
               }).lean();

               let updated = 0,
                    skipped = 0;

               for (const dateNight of recurringDateNights) {
                    try {
                         if (!isOneHourPast(dateNight.UTCDate!)) {
                              skipped++;
                              continue;
                         }
                         console.log(dateNight.UTCDate);
                         const nextDate = getNextDateNightDate(dateNight.UTCDate!, dateNight.repeatEvery);
                         console.log(nextDate);
                         await DateNight.updateOne({ _id: dateNight._id }, { $set: { date: nextDate, isRemainderSent: false } });
                         console.log(`✅ Date Night Updated: ${dateNight.plan} → ${nextDate.toDateString()} at ${dateNight.time || 'N/A'}`);
                         updated++;
                    } catch (err) {
                         console.error(`❌ Error processing date night ${dateNight.plan}:`, err);
                    }
               }

               console.log(`📊 Date Night: Updated ${updated} | Skipped ${skipped}`);
          } catch (error) {
               console.error('❌ Date night automation error:', error);
          }
     },
     {
          timezone: 'UTC',
     },
);
