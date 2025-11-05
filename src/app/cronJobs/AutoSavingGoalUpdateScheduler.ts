import cron from 'node-cron';
import mongoose from 'mongoose';
import { startOfMonth, endOfMonth } from 'date-fns';
import { StatusCodes } from 'http-status-codes';
import { Income } from '../modules/income/income.model';
import AppError from '../../errors/AppError';
import { User } from '../modules/user/user.model';
import { SavingGoal } from '../modules/savingGoal/savingGoal.model';

// ========================================================
// === Helper Function: getAnalyticsFromDB (per user) =====
// ========================================================

const getAnalyticsFromDB = async (userId: string) => {
     const user = await User.isExistUserById(userId);
     if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

     const now = new Date();
     const start = startOfMonth(now);
     const end = endOfMonth(now);

     const result = await Income.aggregate([
          {
               $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    createdAt: { $gte: start, $lte: end },
                    isDeleted: false,
               },
          },
          {
               $group: { _id: null, totalIncome: { $sum: '$amount' } },
          },
          {
               $lookup: {
                    from: 'expenses',
                    let: { userId: new mongoose.Types.ObjectId(userId) },
                    pipeline: [
                         {
                              $match: {
                                   $expr: {
                                        $and: [{ $eq: ['$userId', '$$userId'] }, { $gte: ['$createdAt', start] }, { $lte: ['$createdAt', end] }],
                                   },
                                   isDeleted: false,
                              },
                         },
                         {
                              $group: { _id: null, totalExpenses: { $sum: '$amount' } },
                         },
                    ],
                    as: 'expenseData',
               },
          },
          {
               $lookup: {
                    from: 'budgets',
                    let: { userId: new mongoose.Types.ObjectId(userId) },
                    pipeline: [
                         {
                              $match: {
                                   $expr: {
                                        $and: [{ $eq: ['$userId', '$$userId'] }, { $gte: ['$createdAt', start] }, { $lte: ['$createdAt', end] }],
                                   },
                                   isDeleted: false,
                              },
                         },
                         {
                              $group: { _id: null, totalBudget: { $sum: '$amount' } },
                         },
                    ],
                    as: 'budgetData',
               },
          },
          {
               $lookup: {
                    from: SavingGoal.collection.name,
                    let: { userId: new mongoose.Types.ObjectId(userId) },
                    pipeline: [
                         {
                              $match: {
                                   $expr: {
                                        $and: [{ $eq: ['$userId', '$$userId'] }, { $gte: ['$createdAt', start] }, { $lte: ['$createdAt', end] }, { $gt: [{ $toDate: '$completeDate' }, new Date()] }],
                                   },
                                   isDeleted: false,
                              },
                         },
                         {
                              $group: { _id: null, totalMonthlyTarget: { $sum: '$monthlyTarget' } },
                         },
                    ],
                    as: 'savingGoalData',
               },
          },
          {
               $addFields: {
                    totalExpenses: {
                         $ifNull: [{ $arrayElemAt: ['$expenseData.totalExpenses', 0] }, 0],
                    },
                    budgetOnly: {
                         $ifNull: [{ $arrayElemAt: ['$budgetData.totalBudget', 0] }, 0],
                    },
                    savingGoalMonthly: {
                         $ifNull: [{ $arrayElemAt: ['$savingGoalData.totalMonthlyTarget', 0] }, 0],
                    },
               },
          },
          {
               $addFields: {
                    totalBudget: {
                         $add: [{ $ifNull: ['$budgetOnly', 0] }, { $ifNull: ['$savingGoalMonthly', 0] }],
                    },
                    disposal: {
                         $subtract: [{ $ifNull: ['$totalIncome', 0] }, { $ifNull: ['$totalExpenses', 0] }],
                    },
               },
          },
          {
               $project: {
                    _id: 0,
                    totalIncome: 1,
                    totalExpenses: 1,
                    totalBudget: 1,
                    disposal: 1,
               },
          },
     ]);

     const savingGoal = await SavingGoal.aggregate([
          // 1️⃣ Filter user and remove deleted goals
          {
               $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    isDeleted: false,
               },
          },

          // 2️⃣ Group totals
          {
               $group: {
                    _id: null,
                    totalSavedMoney: { $sum: '$savedMoney' },
                    totalGoalAmount: { $sum: '$totalAmount' },

                    // Weighted sum of completion ratios
                    weightedCompletionSum: {
                         $sum: {
                              $multiply: ['$completionRation', '$totalAmount'],
                         },
                    },
               },
          },

          // 3️⃣ Calculate overall completion rate (weighted average)
          {
               $project: {
                    _id: 0,
                    totalSavedMoney: 1,
                    savingGoalCompletionRate: {
                         $cond: [
                              { $eq: ['$totalGoalAmount', 0] },
                              0,
                              {
                                   $divide: ['$weightedCompletionSum', '$totalGoalAmount'],
                              },
                         ],
                    },
               },
          },
     ]);

     return {
          user,
          analytics: result.length > 0 ? result[0] : {},
          savingGoalCompletionRate: savingGoal[0].savingGoalCompletionRate,
     };
};

// ========================================================
// === Cron Job: Runs end of every month ==================
// ========================================================

const scheduleMonthlyAnalyticsJob = async () => {
     const now = new Date();
     const end = endOfMonth(now);

     // Run only if this is actually the last day of the month
     if (now.getDate() !== end.getDate()) return;

     console.log('🕒 Running monthly analytics job...');

     const users = await User.find({ isDeleted: false, status: 'active' });
     const allResults: any[] = [];

     for (const user of users) {
          const data = await getAnalyticsFromDB(user._id.toString());
          allResults.push(data);

          const { disposal } = data.analytics;

          // === Distribute disposal to saving goals ===
          if (disposal && disposal > 0) {
               const savingGoals = await SavingGoal.find({
                    userId: user._id,
                    isCompleted: false,
               });

               const totalTarget = savingGoals.reduce((acc, g) => acc + g.monthlyTarget, 0);

               for (const goal of savingGoals) {
                    const share = totalTarget > 0 ? (goal.monthlyTarget / totalTarget) * disposal : 0;

                    // Add this month's saved portion
                    goal.savedMoney += share;

                    // Calculate incremental completion % for this month
                    const monthlyPercent = (share / goal.totalAmount) * 100;

                    // Add this month's percent to existing completion
                    goal.completionRation = Math.min(goal.completionRation + monthlyPercent, 100);

                    // Mark goal complete if it reaches 100%
                    if (goal.completionRation >= 100) {
                         goal.isCompleted = true;
                    }

                    await goal.save();
               }
          }
     }

     console.log('✅ Monthly Analytics Results:\n', JSON.stringify(allResults, null, 2));
};

// Run at 23:55 on 28–31 (the last day check prevents multiple runs)

cron.schedule('55 23 28-31 * *', async () => {
     try {
          await scheduleMonthlyAnalyticsJob();
     } catch (err) {
          console.error('❌ Monthly Analytics Scheduler error:', err);
     }
});
