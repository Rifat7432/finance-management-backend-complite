import cron from 'node-cron';
import { Budget } from '../modules/budget/budget.model';
import { startOfDay, addMonths, subMonths } from 'date-fns';
import { getCurrentUTC, getStartOfDayUTC, toUTC } from '../../utils/dateTimeHelper';

// ✔ Updated to check using UTC time
const isToday = (date: Date): boolean => {
     const today = getStartOfDayUTC();
     const utcDate = toUTC(new Date(date.getTime() - 24 * 60 * 60 * 1000));
     return today.getTime() === utcDate.getTime();
};

cron.schedule(
     '5 0 * * *',
     async () => {
          console.log('🔄 Running budget automation (UTC time)...');

          try {
               // Recurring budgets
               const recurringBudgets = await Budget.find({
                    isDeleted: false,
                    frequency: 'monthly',
               }).lean();

               let created = 0,
                    skipped = 0;

               // Process incomes

               // Process budgets
               for (const budget of recurringBudgets) {
                    try {
                         if (!isToday(addMonths(budget.createdAt, 1))) continue;

                         const nextDate = addMonths(new Date(budget.createdAt), 1);
                         const nextDayStart = startOfDay(nextDate);
                         const nextDayEnd = new Date(nextDayStart.getTime() + 24 * 60 * 60 * 1000);

                         const exists = await Budget.exists({
                              name: budget.name,
                              userId: budget.userId,
                              frequency: 'monthly',
                              type: budget.type,
                              category: budget.category,
                              isDeleted: false,
                              createdAt: { $gte: nextDayStart, $lt: nextDayEnd },
                         });

                         if (exists) {
                              skipped++;
                              continue;
                         }

                         await Budget.create({
                              name: budget.name,
                              amount: budget.amount,
                              type: budget.type,
                              category: budget.category,
                              frequency: 'monthly',
                              userId: budget.userId,
                         });

                         console.log(`✅ Budget: ${budget.name} → ${nextDate.toDateString()}`);
                         created++;
                    } catch (err) {
                         console.error(`❌ Error processing budget ${budget.name}:`, err);
                    }
               }

               console.log(`📊 Automation: Created ${created} | Skipped ${skipped}`);
          } catch (error) {
               console.error('❌ Automation error:', error);
          }
     },
     {
          timezone: 'UTC',
     },
);
