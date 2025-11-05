import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SavingGoalService } from './savingGoal.service';

const createSavingGoal = catchAsync(async (req, res) => {
      const userId = req.user?.id
  const result = await SavingGoalService.createSavingGoalToDB(req.body,userId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Saving goal created successfully',
    data: result,
  });
});

const getUserSavingGoals = catchAsync(async (req, res) => {
  const userId = req.user?.id 
  const result = await SavingGoalService.getUserSavingGoalsFromDB(userId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Saving goals retrieved successfully',
    data: result,
  });
});

const getSingleSavingGoal = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SavingGoalService.getSingleSavingGoalFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Saving goal retrieved successfully',
    data: result,
  });
});

const updateSavingGoal = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SavingGoalService.updateSavingGoalToDB(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Saving goal updated successfully',
    data: result,
  });
});

const deleteSavingGoal = catchAsync(async (req, res) => {
  const { id } = req.params;
  await SavingGoalService.deleteSavingGoalFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Saving goal deleted successfully',
  });
});

export const SavingGoalController = {
  createSavingGoal,
  getUserSavingGoals,
  getSingleSavingGoal,
  updateSavingGoal,
  deleteSavingGoal,
};
