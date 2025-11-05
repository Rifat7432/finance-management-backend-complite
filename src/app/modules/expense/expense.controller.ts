import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ExpenseService } from './expense.service';
import { Request } from 'express';

// Create expense
const createExpense = catchAsync(async (req, res) => {
      const userId = req.user?.id
  const result = await ExpenseService.createExpenseToDB(req.body,userId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Expense added successfully',
    data: result,
  });
});

// Get all user expenses
const getUserExpenses = catchAsync(async (req, res) => {
  const user: any = req.user;
  const result = await ExpenseService.getUserExpensesFromDB(user.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Expenses retrieved successfully',
    data: result,
  });
});
// Get all user expenses by frequency
const getUserExpensesByFrequency = catchAsync(async (req: Request, res) => {
  const user: any = req.user;
  const result = await ExpenseService.getUserExpensesByFrequencyFromDB(user.id,req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Expenses retrieved successfully',
    data: result,
  });
});
// Get yearly expense analytics
const getYearlyExpenseAnalytics = catchAsync(async (req: Request, res) => {
  const user: any = req.user;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
  const result = await ExpenseService.getYearlyExpenseAnalyticsFromDB(user.id, year);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Expenses retrieved successfully',
    data: result,
  });
});
// Get single expense
const getSingleExpense = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ExpenseService.getSingleExpenseFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Expense retrieved successfully',
    data: result,
  });
});

// Update expense
const updateExpense = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ExpenseService.updateExpenseToDB(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Expense updated successfully',
    data: result,
  });
});

// Delete expense
const deleteExpense = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ExpenseService.deleteExpenseFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Expense deleted successfully',
    data: result,
  });
});

export const ExpenseController = {
  createExpense,
  getUserExpenses,
  getUserExpensesByFrequency,
  getYearlyExpenseAnalytics,
  getSingleExpense,
  updateExpense,
  deleteExpense,
};
