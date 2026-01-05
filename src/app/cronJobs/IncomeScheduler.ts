import cron from 'node-cron';
import { Income } from '../modules/income/income.model';
import { startOfDay, addMonths, addYears, subWeeks, subMonths, subYears } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
// 🌍 Get the current UK time
const UK_TZ = 'Europe/London';

const nowUK = (): Date => {
  return toZonedTime(new Date(), UK_TZ);
};

const isToday = (date: Date): boolean => {
     console.log(nowUK())
  const today = startOfDay(nowUK());
  const given = startOfDay(toZonedTime(date, UK_TZ));
  console.log(today, date,given);
  console.log(today.getTime(), given.getTime());
  return today.getTime() === given.getTime();
};

// 🔁 Calculate next receive date
const getNextIncomeDate = (date: Date, frequency: string): Date => {
     const d = new Date(date);
     if (frequency === 'monthly') return addMonths(d, 1);
     if (frequency === 'yearly') return addYears(d, 1);
     return d;
};

// ✔ Updated to check using UK time


// Run every 10 seconds (for testing) – IN UK TIME
cron.schedule(
     // '5 0 * * *',
     '*/30 * * * * *',
     async () => {
          console.log('🔄 Running income automation (UK time)...');

          try {
               const today = startOfDay(nowUK());
               const previousWeekStart = startOfDay(subWeeks(today, 1));
               const previousMonthStart = startOfDay(subMonths(today, 1));
               const previousYearStart = startOfDay(subYears(today, 1));

               // Recurring incomes
               const recurringIncomes = await Income.find({
                    isDeleted: false,
                    $or: [
                         {
                              frequency: 'monthly',
                              createdAt: { $gte: previousMonthStart, $lt: today }
                         },
                         { frequency: 'yearly', createdAt: { $gte: previousYearStart, $lt: today } },
                    ],
               }).lean();
               console.log(recurringIncomes);
               let created = 0,
                    skipped = 0;

               for (const income of recurringIncomes) {
                    try {
                         // Must be received today (UK date)
                         console.log(!isToday(income.receiveDate))
                         if (!isToday(income.receiveDate)) continue;
                         const nextDate = getNextIncomeDate(income.receiveDate, income.frequency);
                         const nextDayStart = startOfDay(nextDate);
                         const nextDayEnd = new Date(nextDayStart.getTime() + 24 * 60 * 60 * 1000);
                         // Avoid duplicates
                         const exists = await Income.exists({
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
                         await Income.create({
                              name: income.name,
                              amount: income.amount,
                              receiveDate: nextDate,
                              frequency: income.frequency,
                              userId: income.userId,
                         });

                         console.log(`✅ Income: ${income.name} → ${nextDate.toDateString()}`);
                         created++;
                    } catch (err) {
                         console.error(`❌ Error processing income ${income.name}:`, err);
                    }
               }

               console.log(`📊 Income: Created ${created} | Skipped ${skipped}`);
          } catch (error) {
               console.error('❌ Income automation error:', error);
          }
     },
     {
          timezone: 'Europe/London', // 🇬🇧 UK local time
     },
);
