import cron from 'node-cron';
import { Expense } from '../modules/expense/expense.model';
import { startOfDay, addMonths, addYears, addWeeks, getDay, getDate, getMonth, isSameDay, subWeeks, subMonths, subYears } from 'date-fns';

import { getCurrentUTC, getStartOfDayUTC } from '../../utils/dateTimeHelper';

/** Determines whether today matches the creation day based on frequency */
const isToday = (date: Date): boolean => {
     const today = getStartOfDayUTC();
     return today.getTime() === date.getTime();
};

/** Returns the next expense date based on frequency */
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
/** Cron job: runs at 00:10 UTC every day */
cron.schedule(
     '10 0 * * *',
     async () => {
          console.log('🔄 Running recurring expense automation (UTC time)...');

          try {
               const today = getStartOfDayUTC();
               const recurringExpenses = await Expense.find({
                    isDeleted: false,
                    $or: [{ frequency: 'weekly' }, { frequency: 'monthly' }, { frequency: 'yearly' }],
               }).lean();

               let createdCount = 0;
               let skippedCount = 0;

               for (const expense of recurringExpenses) {
                    const { frequency, endDate } = expense;
                    if (!isToday(endDate)) {
                         skippedCount++;
                         continue;
                    }
                    // Calculate next recurrence
                    const nextExpenseDate = getNextExpenseDate(endDate!, frequency);
                    const nextExpenseDateStart = nextExpenseDate;
                    const nextExpenseDateEnd = new Date(nextExpenseDate.getTime() + 24 * 60 * 60 * 1000);
                    // Avoid duplicates
                    const exists = await Expense.exists({
                         userId: expense.userId,
                         name: expense.name,
                         amount: expense.amount,
                         frequency: expense.frequency,
                         isDeleted: false,
                         endDate: { $gte: nextExpenseDateStart, $lte: nextExpenseDateEnd },
                    });
                    if (exists) {
                         skippedCount++;
                         continue;
                    }
                    // ✅ Create expense
                    await Expense.create({
                         name: expense.name,
                         amount: expense.amount,
                         frequency: expense.frequency,
                         userId: expense.userId,
                         endDate: nextExpenseDate,
                    });

                    console.log(`✅ Created recurring expense "${expense.name}" for ${nextExpenseDate.toDateString()}`);
                    createdCount++;
               }

               console.log(`📊 Recurring Expenses → Created: ${createdCount} | Skipped: ${skippedCount}`);
          } catch (error) {
               console.error('❌ Error during expense automation:', error);
          }
     },
     {
          timezone: 'UTC',
     },
);
