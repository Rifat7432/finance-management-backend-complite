import { StatusCodes } from 'http-status-codes';
import { Expense } from './expense.model';
import AppError from '../../../errors/AppError';
import { IExpense } from './expense.interface';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, startOfWeek, endOfWeek } from 'date-fns';
// Create new expense
const createExpenseToDB = async (payload: Partial<IExpense>, userId: string): Promise<IExpense> => {
     const newExpense = await Expense.create({ ...payload, userId });
     if (!newExpense) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create expense');
     }
     return newExpense;
};

// Get all expenses for a user
const getUserExpensesFromDB = async (userId: string, query: Partial<IExpense>): Promise<IExpense[]> => {
     const weekStart = startOfWeek(new Date());
     const weekEnd = endOfWeek(new Date());
     const monthStart = startOfMonth(new Date());
     const monthEnd = endOfMonth(new Date());
     const yearStart = startOfYear(new Date());
     const yearEnd = endOfYear(new Date());
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
     });
     return expenses;
};
// Get all expenses for a user by frequency
const getUserExpensesByFrequencyFromDB = async (userId: string, query: Partial<IExpense>) => {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  
  const expenses = await Expense.find({
    userId,
    isDeleted: false,
    ...(query.frequency ? { frequency: query.frequency } : {}),
    endDate: { // CHANGED FROM createdAt
      $gte: monthStart,
      $lte: monthEnd,
    },
  });
  
  return expenses;
};

// WHY CHANGED: Already uses endDate - NO CHANGE NEEDED ✅
const getYearlyExpenseAnalyticsFromDB = async (userId: string, year?: number) => {
  const targetYear = year || new Date().getFullYear();
  const yearStart = startOfYear(new Date(targetYear, 0, 1));
  const yearEnd = endOfYear(new Date(targetYear, 0, 1));

  const expenses = await Expense.find({
    userId: userId,
    isDeleted: false,
    endDate: { // Already correct ✅
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
const updateExpenseToDB = async (id: string, payload: Partial<IExpense>): Promise<IExpense | null> => {
     const isExpenseExist = await Expense.findOne({ _id: id, isDeleted: false });
     if (!isExpenseExist) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Expense not found');
     }
     const updated = await Expense.findByIdAndUpdate(id, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update expense');
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
