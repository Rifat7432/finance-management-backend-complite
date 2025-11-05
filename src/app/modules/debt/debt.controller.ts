import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { DebtService } from './debt.service';

const createDebt = catchAsync(async (req, res) => {
    const userId = req.user?.id
  const result = await DebtService.createDebtToDB(req.body,userId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Debt created successfully',
    data: result,
  });
});

const getDebtInsights = catchAsync(async (req, res) => {
  const userId = req.user?.id
  console.log(userId)
  const result = await DebtService.getDebtInsightsFromDB(userId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Debts retrieved successfully',
    data: result,
  });
});
const getUserDebts = catchAsync(async (req, res) => {
  const userId = req.user?.id
  const result = await DebtService.getUserDebtsFromDB(userId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Debts retrieved successfully',
    data: result,
  });
});

const getSingleDebt = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await DebtService.getSingleDebtFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Debt retrieved successfully',
    data: result,
  });
});

const updateDebt = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await DebtService.updateDebtToDB(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Debt updated successfully',
    data: result,
  });
});

const deleteDebt = catchAsync(async (req, res) => {
  const { id } = req.params;
  await DebtService.deleteDebtFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Debt deleted successfully',
  });
});

export const DebtController = {
  createDebt,
  getUserDebts,
  getSingleDebt,
  updateDebt,
  deleteDebt,
  getDebtInsights
};
