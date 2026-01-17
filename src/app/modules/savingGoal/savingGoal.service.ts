import { StatusCodes } from 'http-status-codes';
import { SavingGoal } from './savingGoal.model';
import AppError from '../../../errors/AppError';
import { ISavingGoal } from './savingGole.interface';
import mongoose from 'mongoose';
import { toUTC } from '../../../utils/dateTimeHelper';

const createSavingGoalToDB = async (payload: Partial<ISavingGoal>, userId: string): Promise<ISavingGoal> => {
     const { name, totalAmount, monthlyTarget, date, savedMoney } = payload;
     const startDate = toUTC(date!);
     // Calculate months needed to complete the goal
     const monthsNeeded = Math.ceil((totalAmount! - savedMoney!) / monthlyTarget!);
     // Calculate complete date
     const completeDate = toUTC(startDate);
     completeDate.setMonth(completeDate.getMonth() + monthsNeeded);
     // Save goal to database
     const savingGoal = await SavingGoal.create({
          name,
          totalAmount,
          monthlyTarget,
          date: startDate,
          completeDate: completeDate,
          userId,
          savedMoney,
     });
     return savingGoal;
};

const getUserSavingGoalsFromDB = async (userId: string) => {
     // Get all goals for this user
     const goals = await SavingGoal.find({ userId, isDeleted: false });
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
          savingGoalCompletionRate: savingGoal[0]?.savingGoalCompletionRate ? savingGoal[0]?.savingGoalCompletionRate : 0,
          totalSavedMoney: savingGoal[0]?.totalSavedMoney ? savingGoal[0]?.totalSavedMoney : 0,
          goals,
     };
};

const getSingleSavingGoalFromDB = async (id: string): Promise<ISavingGoal | null> => {
     const goal = await SavingGoal.findById(id);
     if (!goal) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Saving goal not found');
     }
     return goal;
};

const updateSavingGoalToDB = async (id: string, payload: Partial<ISavingGoal>): Promise<ISavingGoal | null> => {
     const currentGoal = await SavingGoal.findById(id);
     if (!currentGoal) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Saving goal not found');
     }
     if (currentGoal.isDeleted) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Saving goal is deleted');
     }

     const updatedTotalAmount = payload.totalAmount ?? currentGoal.totalAmount;
     const updatedMonthlyTarget = payload.monthlyTarget ?? currentGoal.monthlyTarget;
     const updatedDate = payload.date ? toUTC(payload.date) : toUTC(currentGoal.date);

     if ('totalAmount' in payload || 'monthlyTarget' in payload || 'date' in payload) {
          const monthsNeeded = Math.ceil(updatedTotalAmount / updatedMonthlyTarget);
          const newCompleteDate = toUTC(updatedDate);
          newCompleteDate.setMonth(newCompleteDate.getMonth() + monthsNeeded);

          payload.completeDate = newCompleteDate;

          if (payload.date) {
               payload.date = updatedDate;
          }
     }

     const updated = await SavingGoal.findByIdAndUpdate(id, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update saving goal');
     }
     return updated;
};

const deleteSavingGoalFromDB = async (id: string): Promise<boolean> => {
     const goal = await SavingGoal.findOne({ _id: id, isDeleted: false });
     if (!goal || goal.isDeleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Saving goal is already deleted or not found');
     }
     const deleted = await SavingGoal.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
     if (!deleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Saving goal not found');
     }
     return true;
};

export const SavingGoalService = {
     createSavingGoalToDB,
     getUserSavingGoalsFromDB,
     getSingleSavingGoalFromDB,
     updateSavingGoalToDB,
     deleteSavingGoalFromDB,
};
