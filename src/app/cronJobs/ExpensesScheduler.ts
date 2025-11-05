import cron from 'node-cron';
import { Expense } from '../modules/expense/expense.model';
import { startOfDay, addMonths, addYears, addWeeks } from 'date-fns';

const isToday = (date: Date): boolean => {
  const today = startOfDay(new Date());
  const given = startOfDay(new Date(date));
  return today.getTime() === given.getTime();
};
const getNextExpenseDate = (date: Date, frequency: string): Date => {
  const d = new Date(date);
  if (frequency === 'weekly') return addWeeks(d, 1);
  if (frequency === 'monthly') return addMonths(d, 1);
  if (frequency === 'yearly') return addYears(d, 1);
  return d;
};

// WHY CHANGED: Run at 00:10 to avoid conflicts with income cron
cron.schedule('10 0 * * *', async () => {
  console.log('🔄 Running expense automation...');
  
  try {
    // WHY CHANGED: Get ALL recurring expenses, filter by date
    const recurringExpenses = await Expense.find({
      frequency: { $in: ['weekly', 'monthly', 'yearly'] },
      isDeleted: false,
    }).lean();

    let created = 0, skipped = 0;

    for (const expense of recurringExpenses) {
      try {
        // Check if TODAY is the endDate
        if (!isToday(expense.endDate)) continue;

        const nextDate = getNextExpenseDate(expense.endDate, expense.frequency);

        // WHY CHANGED: Fixed date mutation bug
        const nextDayStart = startOfDay(nextDate);
        const nextDayEnd = new Date(nextDayStart.getTime() + 24 * 60 * 60 * 1000);

        // Check if next period expense already exists
        const exists = await Expense.exists({
          name: expense.name,
          userId: expense.userId,
          frequency: expense.frequency,
          isDeleted: false,
          endDate: { $gte: nextDayStart, $lt: nextDayEnd },
        });

        if (exists) {
          skipped++;
          continue;
        }

        // Create new expense for next period
        await Expense.create({
          name: expense.name,
          amount: expense.amount,
          endDate: nextDate,
          frequency: expense.frequency,
          userId: expense.userId,
        });

        console.log(`✅ Expense: ${expense.name} → ${nextDate.toDateString()}`);
        created++;
      } catch (err) {
        console.error(`❌ Error processing expense ${expense.name}:`, err);
      }
    }

    console.log(`📊 Expense: Created ${created} | Skipped ${skipped}`);
  } catch (error) {
    console.error('❌ Expense automation error:', error);
  }
});