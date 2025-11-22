import cron from 'node-cron';
import { Income } from '../modules/income/income.model';
import { startOfDay, addMonths, addYears, addWeeks, subWeeks, subMonths, subYears } from 'date-fns';
// 🔁 Calculate next receive date
const getNextIncomeDate = (date: Date, frequency: string): Date => {
     const d = new Date(date);
     if (frequency === 'monthly') return addMonths(d, 1);
     if (frequency === 'yearly') return addYears(d, 1);
     return d;
};

// WHY CHANGED: Simplified to just check if dates match (no complex logic)
const isToday = (date: Date): boolean => {
     const today = startOfDay(new Date());
     const given = startOfDay(new Date(date));
     return today.getTime() === given.getTime();
};

// WHY CHANGED: Run at 00:05 instead of 00:00 to avoid conflicts
cron.schedule('5 0 * * *', async () => {
     console.log('🔄 Running income automation...');

     try {
          const today = startOfDay(new Date());
          const previousWeekStart = startOfDay(subWeeks(today, 1));
          const previousMonthStart = startOfDay(subMonths(today, 1));
          const previousYearStart = startOfDay(subYears(today, 1));

          // WHY CHANGED: Get ALL recurring incomes, filter by date (simpler query)
          const recurringIncomes = await Income.find({
               isDeleted: false,
               $or: [
                    { frequency: 'monthly', createdAt: { $gte: previousMonthStart, $lt: today } },
                    { frequency: 'yearly', createdAt: { $gte: previousYearStart, $lt: today } },
               ],
          }).lean();
          let created = 0,
               skipped = 0;

          for (const income of recurringIncomes) {
               try {
                    // Check if TODAY is the receiveDate
                    if (!isToday(income.receiveDate)) continue;

                    const nextDate = getNextIncomeDate(income.receiveDate, income.frequency);

                    // WHY CHANGED: Fixed date mutation bug with setHours
                    const nextDayStart = startOfDay(nextDate);
                    const nextDayEnd = new Date(nextDayStart.getTime() + 24 * 60 * 60 * 1000);

                    // Check if next month/year income already exists
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

                    // Create new income for next period
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
});
