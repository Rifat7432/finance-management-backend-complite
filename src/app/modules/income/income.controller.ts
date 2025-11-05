import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IncomeService } from './income.service';
import { Request } from 'express';

// Create income
const createIncome = catchAsync(async (req, res) => {
    const userId = req.user?.id
  const result = await IncomeService.createIncomeToDB(req.body,userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Income added successfully',
    data: result,
  });
});

// Get all incomes for logged-in user
const getUserIncomes = catchAsync(async (req: Request, res) => {
  const user: any = req.user;
  const result = await IncomeService.getUserIncomesFromDB(user.id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Incomes retrieved successfully',
    data: result,
  });
});
// Get all incomes for logged-in user by frequency
const getUserIncomesByFrequency = catchAsync(async (req: Request, res) => {
  const user: any = req.user;
  const result = await IncomeService.getUserIncomesByFrequencyFromDB(user.id,req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Incomes retrieved successfully',
    data: result,
  });
});

// Get a single income by ID
const getSingleIncome = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await IncomeService.getSingleIncomeFromDB(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Income retrieved successfully',
    data: result,
  });
});

// Update income
const updateIncome = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await IncomeService.updateIncomeToDB(id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Income updated successfully',
    data: result,
  });
});

// Delete income
const deleteIncome = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await IncomeService.deleteIncomeFromDB(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Income deleted successfully',
    data: result,
  });
});

export const IncomeController = {
  createIncome,
  getUserIncomes,
  getUserIncomesByFrequency,
  getSingleIncome,
  updateIncome,
  deleteIncome,
};
