import cron from 'node-cron';
import { Income } from '../modules/income/income.model';
import { startOfDay, addMonths, addYears, subWeeks, subMonths, subYears } from 'date-fns';
import { getCurrentUTC, getEndOfTodayUTC, getStartOfDayUTC, getStartOfTodayUTC, toUTC } from '../../utils/dateTimeHelper';

const isToday = (date: Date): boolean => {
     const today = getStartOfDayUTC();
     return today.getTime() === date.getTime();
};

// 🔁 Calculate next receive date
const getNextIncomeDate = (date: Date, frequency: string): Date => {
     const d = new Date(date);
     if (frequency === 'monthly') return addMonths(d, 1);
     if (frequency === 'yearly') return addYears(d, 1);
     return d;
};

// ✔ Updated to check using UTC time

// Run at 5:00 UTC every day
cron.schedule(
     '5 0 * * *',
     async () => {
          console.log('🔄 Running income automation (UTC time)...');

          try {
               // Recurring incomes
               const recurringIncomes = await Income.find({
                    isDeleted: false,
                    $or: [
                         {
                              frequency: 'monthly',
                         },
                         { frequency: 'yearly' },
                    ],
               }).lean();
               let created = 0,
                    skipped = 0;
               for (const income of recurringIncomes) {
                    try {
                         // Must be received today (UTC date)
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
          timezone: 'UTC',
     },
);
