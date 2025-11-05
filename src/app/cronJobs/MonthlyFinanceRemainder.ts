import cron from 'node-cron';
import mongoose, { Mongoose } from 'mongoose';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { User } from '../modules/user/user.model';
import { Income } from '../modules/income/income.model';
import { Expense } from '../modules/expense/expense.model';
import { Budget } from '../modules/budget/budget.model';
import { emailTemplate } from '../../shared/emailTemplate';
import { emailHelper } from '../../helpers/emailHelper';

// ========================================================
// === Finance Reminder Logic =============================
// ========================================================

const scheduleMonthlyFinanceReminderJob = async () => {
     const now = new Date();
     const start = startOfMonth(now);
     const end = endOfMonth(now);
     const monthName = format(now, 'MMMM yyyy');

     console.log(`📆 Running monthly finance reminder for ${monthName}`);

     // 1️⃣ Fetch all active users
     const users = await User.find({ isDeleted: false, status: 'active' });
     if (!users.length) return console.log('No active users found.');

     // 2️⃣ For each user, compute totals
     for (const user of users) {
          const userId = new mongoose.Types.ObjectId(user._id);

          // --- income ---
          const incomeAgg = await Income.aggregate([
               {
                    $match: {
                         userId,
                         isDeleted: false,
                         createdAt: { $gte: start, $lte: end },
                    },
               },
               { $group: { _id: null, totalIncome: { $sum: '$amount' } } },
          ]);

          const totalIncome = incomeAgg?.[0]?.totalIncome || 0;

          // --- expenses ---
          const expensesAgg = await Expense.aggregate([
               {
                    $match: {
                         userId,
                         isDeleted: false,
                         createdAt: { $gte: start, $lte: end },
                    },
               },
               { $group: { _id: null, totalExpenses: { $sum: '$amount' } } },
          ]);

          const totalExpenses = expensesAgg?.[0]?.totalExpenses || 0;

          // --- budgets ---
          const budgetsAgg = await Budget.aggregate([
               {
                    $match: {
                         userId,
                         isDeleted: false,
                         createdAt: { $gte: start, $lte: end },
                    },
               },
               { $group: { _id: null, totalBudget: { $sum: '$amount' } } },
          ]);

          const totalBudget = budgetsAgg?.[0]?.totalBudget || 0;

          const disposable = totalIncome - totalExpenses;

          // 3️⃣ Send relevant notifications
          const userData = {
               email: user.email,
               name: user.name || 'User',
               income: totalIncome,
               totalBudget,
               totalExpenses,
          };

          // (a) Budget > Income
          if (totalBudget > totalIncome) {
               const emailData = emailTemplate.budgetExceedsIncome(userData);
               await emailHelper.sendEmail(emailData);
          }

          // (b) Expenses > Income
          if (totalExpenses > totalIncome) {
               const emailData = emailTemplate.expensesExceedIncome(userData);
               await emailHelper.sendEmail(emailData);
          }

          // (c) Always send monthly summary
          const summaryEmail = emailTemplate.monthlySummary({
               email: user.email,
               name: user.name || 'User',
               month: monthName,
               income: totalIncome,
               budget: totalBudget,
               expenses: totalExpenses,
               disposable,
          });
          await emailHelper.sendEmail(summaryEmail);

          console.log(`📨 Emails sent for user: ${user.email}`);
     }

     console.log('✅ Monthly Finance Reminder Job Completed.');
};

// ========================================================
// === Cron Scheduler =====================================
// ========================================================

cron.schedule('55 23 28-31 * *', async () => {
     try {
          const now = new Date();
          const end = endOfMonth(now);
          // Only run on the *actual* last day of month
          if (now.getDate() !== end.getDate()) return;

          await scheduleMonthlyFinanceReminderJob();
     } catch (err) {
          console.error('❌ Monthly Finance Reminder Scheduler error:', err);
     }
});

export { scheduleMonthlyFinanceReminderJob };
