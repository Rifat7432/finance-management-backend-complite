import { StatusCodes } from 'http-status-codes';
import { User } from '../user/user.model';
import AppError from '../../../errors/AppError';
import { Income } from '../income/income.model';

import { endOfMonth, startOfMonth } from 'date-fns';
import mongoose from 'mongoose';
import { SavingGoal } from '../savingGoal/savingGoal.model';
import { Budget } from '../budget/budget.model';
import { Expense } from '../expense/expense.model';
import { Appointment } from '../appointment/appointment.model';
import { DateNight } from '../dateNight/dateNight.model';

// create user
const getAnalyticsFromDB = async (userId: string) => {
     const user = await User.isExistUserById(userId);
     if (!user) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }
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
               $group: {
                    _id: null,
                    totalIncome: { $sum: '$amount' },
               },
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
                              $group: {
                                   _id: null,
                                   totalExpenses: { $sum: '$amount' },
                              },
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
                              $group: {
                                   _id: null,
                                   totalBudget: { $sum: '$amount' },
                              },
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
                                        $and: [
                                             { $eq: ['$userId', '$$userId'] },
                                             { $gte: ['$createdAt', start] },
                                             { $lte: ['$createdAt', end] },
                                             { $gt: [{ $toDate: '$completeDate' }, new Date()] }, // convert string to date here
                                        ],
                                   },
                                   isDeleted: false,
                              },
                         },

                         {
                              $group: {
                                   _id: null,
                                   totalMonthlyTarget: { $sum: '$monthlyTarget' },
                              },
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

     const { totalSavedMoney, savingGoalCompletionRate } = savingGoal[0];
     return { user, analytics: result.length > 0 ? result[0] : {}, savingGoalCompletionRate, totalSavedMoney };
};
const getLatestUpdateFromDB = async (userId: string) => {
     const user = await User.isExistUserById(userId);
     if (!user) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }

     const appointments = await Appointment.find({ userId, isDeleted: false }).sort({ createdAt: -1 });
     const dateNights = await DateNight.find({ userId, isDeleted: false }).sort({ createdAt: -1 }).limit(2);
     const expenses = await Expense.find({ userId, isDeleted: false }).sort({ createdAt: -1 }).limit(2);

     console.log(appointments, dateNights, expenses);

     return {
          appointments,
          dateNights,
          expenses,
     };
};

export const AnalyticsService = {
     getAnalyticsFromDB,
     getLatestUpdateFromDB,
};
