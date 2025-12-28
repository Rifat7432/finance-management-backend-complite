import cron from 'node-cron';
import { Budget } from '../modules/budget/budget.model';
import { startOfDay, addMonths,  subMonths } from 'date-fns';

// 🌍 Get the current UK time
const nowUK = (): Date => {
     return new Date(new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }));
};


// ✔ Updated to check using UK time
const isToday = (date: Date): boolean => {
     const today = startOfDay(nowUK());
     const given = startOfDay(new Date(date));
     return today.getTime() === given.getTime();
};

// Run every 10 seconds (for testing) – IN UK TIME
cron.schedule(
     '5 0 * * *',
     async () => {
          console.log('🔄 Running income & budget automation (UK time)...');

          try {
               const today = startOfDay(nowUK());

               const previousMonthStart = startOfDay(subMonths(today, 1));

               // Recurring incomes

               // Recurring budgets
               const recurringBudgets = await Budget.find({
                    isDeleted: false,
                    frequency: 'monthly',
                    createdAt: { $gte: previousMonthStart, $lt: today },
               }).lean();

               let created = 0,
                    skipped = 0;

               // Process incomes

               // Process budgets
               for (const budget of recurringBudgets) {
                    try {
                         if (!isToday(budget.createdAt)) continue;

                         const nextDate = addMonths(new Date(budget.createdAt), 1);
                         const nextDayStart = startOfDay(nextDate);
                         const nextDayEnd = new Date(nextDayStart.getTime() + 24 * 60 * 60 * 1000);

                         const exists = await Budget.exists({
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

                         await Budget.create({
                              name: budget.name,
                              amount: budget.amount,
                              type: budget.type,
                              frequency: 'monthly',
                              startDate: nextDate,
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
          timezone: 'Europe/London',
     },
);
