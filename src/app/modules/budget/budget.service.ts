import { StatusCodes } from 'http-status-codes';
import { Budget } from './budget.model';
import AppError from '../../../errors/AppError';
import { BudgetWithCreatedAt, IBudget } from './budget.interface';
import { endOfMonth, endOfYear, startOfMonth, startOfYear } from 'date-fns';
import { User } from '../user/user.model';

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
export const getUserBudgetsByTypeFromDB = async (partnerId: string, userId: string, query: Partial<IBudget>) => {
     const userInfo = await User.findById(userId);
     if (!userInfo) {
          throw new AppError(404, 'User not found');
     }
     const today = new Date();
     const monthStart = startOfMonth(today);
     const monthEnd = endOfMonth(today);
     const allBudgets: any[] = [];
     const budgets = await Budget.find({
          userId,
          isDeleted: false,
          ...(query.type ? { type: query.type } : {}),
          createdAt: {
               $gte: monthStart,
               $lte: monthEnd,
          },
     });
     const addTaggedUserBudgets = budgets.map((budget) => ({
          ...budget.toObject(),
          taggedPartner: false,
     }));
     allBudgets.push(...addTaggedUserBudgets);
     if (query.type === 'household' && userInfo.partnerId) {
          const partnerBudgets = await Budget.find({
               userId:  userInfo.partnerId,
               isDeleted: false,
               type: 'household',
               createdAt: {
                    $gte: monthStart,
                    $lte: monthEnd,
               },
          });
          const addTaggedPartnerBudgets = partnerBudgets.map((budget) => ({
               ...budget.toObject(),
               taggedPartner: true,
          }));
          allBudgets.push(...addTaggedPartnerBudgets);
     }
  const partnerInfo = await User.findById(userInfo.partnerId).select('name email image isDeleted status');
     return { budgetData: allBudgets, partnerInfo };
};

// Yearly budget analytics for a given user
const getYearlyBudgetAnalyticsFromDB = async (userId: string, year?: number) => {
     const targetYear = year || new Date().getFullYear();
     const yearStart = startOfYear(new Date(targetYear, 0, 1));
     const yearEnd = endOfYear(new Date(targetYear, 0, 1));

     const budgets = await Budget.find({
          userId,
          isDeleted: false,
          createdAt: {
               $gte: yearStart,
               $lte: yearEnd,
          },
     })
          .select('amount category createdAt')
          .lean<
               {
                    amount: number;
                    category: string;
                    createdAt: Date;
               }[]
          >();

     const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

     // Initialize monthly structure
     const monthlyData = Array.from({ length: 12 }, () => ({
          totalBudget: 0,
          essential: 0,
          discretionary: 0,
          savings: 0,
     }));

     budgets.forEach((budget) => {
          const monthIndex = new Date(budget.createdAt).getMonth();
          const amount = budget.amount;

          monthlyData[monthIndex].totalBudget += amount;

          switch (budget.category) {
               case 'Essential(Needs)':
                    monthlyData[monthIndex].essential += amount;
                    break;

               case 'Discretionary(Wants)':
                    monthlyData[monthIndex].discretionary += amount;
                    break;

               case 'Savings':
                    monthlyData[monthIndex].savings += amount;
                    break;
          }
     });

     return monthNames.map((month, index) => ({
          month,
          totalBudget: monthlyData[index].totalBudget,
          essential: monthlyData[index].essential,
          discresonary: monthlyData[index].discretionary, // keeping your spelling
          savings: monthlyData[index].savings,
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
