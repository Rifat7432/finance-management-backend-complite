import cron from 'node-cron';
import { Expense } from '../modules/expense/expense.model';
import { startOfDay, addMonths, addYears, addWeeks, getDay, getDate, getMonth, isSameDay, subWeeks, subMonths, subYears } from 'date-fns';

/**
 * Determines whether today matches the creation day
 * based on frequency.
 */
const shouldCreateToday = (createdAtDate: Date, frequency: string): boolean => {
     const today = new Date();
     const createdAt = new Date(createdAtDate);

     switch (frequency) {
          case 'weekly':
               return getDay(today) === getDay(createdAt);
          case 'monthly':
               return getDate(today) === getDate(createdAt);
          case 'yearly':
               return getDate(today) === getDate(createdAt) && getMonth(today) === getMonth(createdAt);
          default:
               return false;
     }
};

/**
 * Returns the next expense date based on frequency.
 */
const getNextExpenseDate = (fromDate: Date, frequency: string): Date => {
     const baseDate = new Date(fromDate);

     switch (frequency) {
          case 'weekly':
               return addWeeks(baseDate, 1);
          case 'monthly':
               return addMonths(baseDate, 1);
          case 'yearly':
               return addYears(baseDate, 1);
          default:
               return baseDate;
     }
};

/**
 * Cron job: Runs daily at 00:10
 */
cron.schedule('10 0 * * *', async () => {
     console.log('🔄 Running recurring expense automation...');

     try {
          const startOfToday = startOfDay(new Date());
          const endOfToday = new Date(startOfToday);
          endOfToday.setHours(23, 59, 59, 999);
          const previousWeekStart = startOfDay(subWeeks(startOfToday, 1));
          const previousMonthStart = startOfDay(subMonths(startOfToday, 1));
          const previousYearStart = startOfDay(subYears(startOfToday, 1));

          const recurringExpenses = await Expense.find({
               isDeleted: false,
               $or: [
                    { frequency: 'weekly', createdAt: { $gte: previousWeekStart, $lt: startOfToday } },
                    { frequency: 'monthly', createdAt: { $gte: previousMonthStart, $lt: startOfToday } },
                    { frequency: 'yearly', createdAt: { $gte: previousYearStart, $lt: startOfToday } },
               ],
          }).lean();
          let createdCount = 0;
          let skippedCount = 0;

          const today = startOfDay(new Date());

          for (const expense of recurringExpenses) {
               const { createdAt, frequency, endDate } = expense;

               if (!shouldCreateToday(createdAt!, frequency)) {
                    skippedCount++;
                    continue;
               }

               // Calculate next recurrence
               const nextExpenseDate = startOfDay(getNextExpenseDate(createdAt!, frequency));

               // Skip if the schedule's endDate has passed
               if (new Date(endDate) < today || new Date(endDate) < new Date(nextExpenseDate)) {
                    skippedCount++;
                    continue;
               }

               // ✅ Create only if nextExpenseDate is TODAY
               if (!isSameDay(nextExpenseDate, today)) {
                    skippedCount++;
                    continue;
               }

               // Check if an expense already exists for that user on the same recurrence date
               const exists = await Expense.exists({
                    userId: expense.userId,
                    name: expense.name,
                    amount: expense.amount,
                    frequency: expense.frequency,
                    isDeleted: false,
                    createdAt: { $gte: startOfToday, $lte: endOfToday },
               });

               if (exists) {
                    skippedCount++;
                    continue;
               }

               // ✅ Create a new expense
               await Expense.create({
                    name: expense.name,
                    amount: expense.amount,
                    frequency: expense.frequency,
                    userId: expense.userId,
               });

               console.log(`✅ Created recurring expense "${expense.name}" for ${nextExpenseDate.toDateString()}`);
               createdCount++;
          }

          console.log(`📊 Recurring Expenses → Created: ${createdCount} | Skipped: ${skippedCount}`);
     } catch (error) {
          console.error('❌ Error during expense automation:', error);
     }
});
