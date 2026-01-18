import { StatusCodes } from 'http-status-codes';
import { Expense } from './expense.model';
import AppError from '../../../errors/AppError';
import { IExpense } from './expense.interface';
import { startOfWeek, endOfWeek } from 'date-fns';
import { getCurrentUTC, getEndOfMonthUTC, getEndOfYearUTC, getStartOfMonthUTC, getStartOfYearUTC, toUTC } from '../../../utils/dateTimeHelper';
import { Budget } from '../budget/budget.model';

interface BudgetExtraType {
     category: string;
     type: string;
}
// Create new expense
const createExpenseToDB = async (payload: Partial<IExpense & BudgetExtraType>, userId: string) => {
     const { endDate, category, type, ...rest } = payload;
     const utcEndDate = toUTC(endDate as Date);
     const newExpense = await Expense.create({ ...rest, endDate: utcEndDate, userId });
     if (!newExpense) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create expense');
     }
     if (category && type) {
          const budget = await Budget.create({
               userId,
               expensesId: newExpense._id,
               category,
               type,
               amount: payload.amount,
               name: payload.name,
               ...(payload.frequency === 'on-off' ? { frequency: payload.frequency } : {}),
          });
          if (budget) {
               const updatedExpense = await Expense.findByIdAndUpdate(newExpense._id, { budgetId: budget._id }, { new: true });
               return updatedExpense;
          }
     }
     return newExpense;
};

// Get all expenses for a user
const getUserExpensesFromDB = async (userId: string, query: Partial<IExpense>): Promise<IExpense[]> => {
     const weekStart = startOfWeek(getCurrentUTC());
     const weekEnd = endOfWeek(getCurrentUTC());
     const monthStart = getStartOfMonthUTC();
     const monthEnd = getEndOfMonthUTC();
     const yearStart = getStartOfYearUTC();
     const yearEnd = getEndOfYearUTC();
     const expenses = await Expense.find({
          isDeleted: false,
          userId,
          ...(query.frequency
               ? query.frequency === 'weekly'
                    ? {
                           endDate: {
                                // CHANGED FROM createdAt
                                $gte: weekStart,
                                $lte: weekEnd,
                           },
                      }
                    : query.frequency === 'monthly'
                      ? {
                             endDate: {
                                  // CHANGED FROM createdAt
                                  $gte: monthStart,
                                  $lte: monthEnd,
                             },
                        }
                      : query.frequency === 'yearly'
                        ? {
                               endDate: {
                                    // CHANGED FROM createdAt
                                    $gte: yearStart,
                                    $lte: yearEnd,
                               },
                          }
                        : { frequency: query.frequency }
               : {}),
     }).populate('budgetId', 'type category');
     return expenses;
};
// Get all expenses for a user by frequency
const getUserExpensesByFrequencyFromDB = async (userId: string, query: Partial<IExpense>) => {
     const monthStart = getStartOfMonthUTC();
     const monthEnd = getEndOfMonthUTC();
     const expenses = await Expense.find({
          userId,
          isDeleted: false,
          ...(query.frequency ? { frequency: query.frequency } : {}),
          endDate: {
               // CHANGED FROM createdAt
               $gte: monthStart,
               $lte: monthEnd,
          },
     });

     return expenses;
};
// WHY CHANGED: Already uses endDate - NO CHANGE NEEDED ✅
const getYearlyExpenseAnalyticsFromDB = async (userId: string, year?: number) => {
     const targetYear = year || getCurrentUTC().getFullYear();
     const yearStart = getStartOfYearUTC(new Date(targetYear, 0, 1));
     const yearEnd = getEndOfYearUTC(new Date(targetYear, 0, 1));

     const expenses = await Expense.find({
          userId: userId,
          isDeleted: false,
          endDate: {
               // Already correct ✅
               $gte: yearStart.toISOString(),
               $lte: yearEnd.toISOString(),
          },
     }).lean();

     const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
     const monthlyTotals = Array(12).fill(0);

     expenses.forEach((expense) => {
          const monthIndex = new Date(expense.endDate).getMonth();
          monthlyTotals[monthIndex] += expense.amount;
     });

     return monthNames.map((month, index) => ({
          month,
          totalExpenses: monthlyTotals[index],
     }));
};

// Get a single expense
const getSingleExpenseFromDB = async (id: string): Promise<IExpense | null> => {
     const expense = await Expense.findById(id);
     if (!expense) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Expense not found');
     }
     if (expense.isDeleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Expense Deleted');
     }
     return expense;
};

// Update expense
const updateExpenseToDB = async (id: string, payload: Partial<IExpense & BudgetExtraType>): Promise<IExpense | null> => {
     const isExpenseExist = await Expense.findOne({ _id: id, isDeleted: false });
     if (!isExpenseExist) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Expense not found');
     }
     // const { endDate, category, type, ...rest } = payload;
     if (payload?.endDate) {
          payload.endDate = toUTC(payload.endDate as Date);
     }
     const updated = await Expense.findByIdAndUpdate(id, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update expense');
     }
     if (payload.category && payload.type && payload.amount && payload.category && payload.frequency) {
          await Budget.findOneAndUpdate(
               { expensesId: isExpenseExist._id },
               {
                    ...(payload.category ? { category: payload.category } : {}),
                    ...(payload.type ? { type: payload.type } : {}),
                    ...(payload.amount ? { amount: payload.amount } : {}),
                    ...(payload.name ? { name: payload.name } : {}),
                    ...(payload.frequency === 'on-off' ? { frequency: payload.frequency } : {}),
               },
               { new: true },
          );
     }

     return updated;
};

// Delete expense
const deleteExpenseFromDB = async (id: string): Promise<boolean> => {
     const isExpenseExist = await Expense.findOne({ _id: id, isDeleted: false });
     if (!isExpenseExist) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Expense not found');
     }
     const deleted = await Expense.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
     if (!deleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Expense not found');
     }
     if (isExpenseExist.budgetId && deleted.isDeleted) {
          await Budget.findOneAndUpdate({ expensesId: isExpenseExist._id }, { isDeleted: true }, { new: true });
     }
     return true;
};

export const ExpenseService = {
     createExpenseToDB,
     getUserExpensesFromDB,
     getUserExpensesByFrequencyFromDB,
     getYearlyExpenseAnalyticsFromDB,
     getSingleExpenseFromDB,
     updateExpenseToDB,
     deleteExpenseFromDB,
};
