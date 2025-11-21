import { StatusCodes } from 'http-status-codes';
import { Budget } from './budget.model';
import AppError from '../../../errors/AppError';
import { BudgetWithCreatedAt, IBudget } from './budget.interface';
import { endOfMonth, endOfYear, startOfMonth, startOfYear } from 'date-fns';

const createBudgetToDB = async (payload: Partial<IBudget>, userId: string): Promise<IBudget> => {
     const newBudget = await Budget.create({ ...payload, userId });
     if (!newBudget) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create budget');
     }
     return newBudget;
};

const getUserBudgetsFromDB = async (userId: string): Promise<IBudget[]> => {
     const budgets = await Budget.find({ userId, isDeleted: false });
     if (!budgets.length) {
          throw new AppError(StatusCodes.NOT_FOUND, 'No budgets found for this user');
     }
     return budgets;
};

// Get all budgets for a user by type (personal/household) in current month
export const getUserBudgetsByTypeFromDB = async (partnerId: string, userId: string, query: Partial<IBudget>): Promise<IBudget[]> => {
     const today = new Date();
     const monthStart = startOfMonth(today);
     const monthEnd = endOfMonth(today);

     const budgets = await Budget.find({
          userId,
          isDeleted: false,
          ...(query.type ? { type: query.type } : {}),
          createdAt: {
               $gte: monthStart,
               $lte: monthEnd,
          },
     });
     if (query.type === 'household' && partnerId) {
          const partnerBudgets = await Budget.find({
               userId: partnerId,
               isDeleted: false,
               type: 'household',
               createdAt: {
                    $gte: monthStart,
                    $lte: monthEnd,
               },
          });
          budgets.push(...partnerBudgets);
     }
     return budgets;
};

// Yearly budget analytics for a given user
export const getYearlyBudgetAnalyticsFromDB = async (userId: string, year?: number) => {
     const targetYear = year || new Date().getFullYear();
     const yearStart = startOfYear(new Date(targetYear, 0, 1));
     const yearEnd = endOfYear(new Date(targetYear, 0, 1));

     // Fetch all budgets created within the target year
     const budgets = await Budget.find({
          userId,
          isDeleted: false,
          createdAt: {
               $gte: yearStart,
               $lte: yearEnd,
          },
     })
          .select('amount createdAt')
          .lean<BudgetWithCreatedAt[]>();

     // Month names
     const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

     // Initialize totals
     const monthlyTotals = Array(12).fill(0);

     // Sum amounts
     budgets.forEach((budget) => {
          const monthIndex = new Date(budget.createdAt).getMonth();
          monthlyTotals[monthIndex] += budget.amount;
     });

     // Format output
     return monthNames.map((month, index) => ({
          month,
          totalBudget: monthlyTotals[index],
     }));
};

const updateBudgetToDB = async (id: string, payload: Partial<IBudget>): Promise<IBudget | null> => {
     const isBudgetExist = await Budget.findOne({ _id: id, isDeleted: false });
     if (!isBudgetExist) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Budget is already deleted or not found');
     }
     const updated = await Budget.findByIdAndUpdate(id, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update budget');
     }
     return updated;
};

const deleteBudgetFromDB = async (id: string): Promise<boolean> => {
     const isBudgetExist = await Budget.findOne({ _id: id, isDeleted: false });
     if (!isBudgetExist) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Budget is already deleted or not found');
     }
     const deleted = await Budget.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
     if (!deleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Budget not found');
     }
     return true;
};

export const BudgetService = {
     createBudgetToDB,
     getUserBudgetsFromDB,
     getUserBudgetsByTypeFromDB,
     getYearlyBudgetAnalyticsFromDB,
     updateBudgetToDB,
     deleteBudgetFromDB,
};
