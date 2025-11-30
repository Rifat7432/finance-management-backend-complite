import cron from 'node-cron';
import { DateNight } from '../modules/dateNight/dateNight.model';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

/** 🌍 Helper to get current UK time */
const nowUK = (): Date => {
     return new Date(new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }));
};

// 🔁 Calculate next date night date
const getNextDateNightDate = (date: Date, repeatEvery: string): Date => {
     const d = new Date(date);
     if (repeatEvery === 'Daily') return addDays(d, 1);
     if (repeatEvery === 'Weekly') return addWeeks(d, 1);
     if (repeatEvery === 'Monthly') return addMonths(d, 1);
     if (repeatEvery === 'Yearly') return addYears(d, 1);
     return d;
};

// Check if it's been at least 1 hour after the date + time (UK time)
const isOneHourPast = (date: Date, time?: string): boolean => {
     const now = nowUK();

     // Combine date and time into a full datetime
     const dateTimeString = time
          ? `${date.toISOString().split('T')[0]}T${time}:00.000Z`
          : date.toISOString();

     const dateNightDateTime = new Date(dateTimeString);
     const oneHourAfter = new Date(dateNightDateTime.getTime() + 60 * 60 * 1000);

     return now >= oneHourAfter;
};


cron.schedule(
      '0 * * * *',
     async () => {
          console.log('🔄 Running date night automation (UK time)...');

          try {
               // Get ALL recurring date nights (no date filtering)
               const recurringDateNights = await DateNight.find({
                    isDeleted: false,
                    date: { $exists: true },
                    repeatEvery: { $in: ['Daily', 'Weekly', 'Monthly', 'Yearly'] },
               }).lean();

               let updated = 0,
                    skipped = 0;

               for (const dateNight of recurringDateNights) {
                    try {
                         if (!isOneHourPast(dateNight.date!, dateNight.time)) {
                              skipped++;
                              continue;
                         }

                         const nextDate = getNextDateNightDate(dateNight.date!, dateNight.repeatEvery);

                         await DateNight.updateOne({ _id: dateNight._id }, { $set: { date: nextDate } });

                         console.log(
                              `✅ Date Night Updated: ${dateNight.plan} → ${nextDate.toDateString()} at ${
                                   dateNight.time || 'N/A'
                              }`
                         );
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
          timezone: 'Europe/London', // 🇬🇧 UK time
     }
);
