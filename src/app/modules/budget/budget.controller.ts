import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { BudgetService } from './budget.service';

const createBudget = catchAsync(async (req, res) => {
     const userId = req.user?.id;
     const result = await BudgetService.createBudgetToDB(req.body, userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.CREATED,
          message: 'Budget created successfully',
          data: result,
     });
});

const getUserBudgets = catchAsync(async (req, res) => {
     const userId = req.user?.id;
     const result = await BudgetService.getUserBudgetsFromDB(userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Budgets retrieved successfully',
          data: result,
     });
});

export const getUserBudgetsByType = catchAsync(async (req, res) => {
     const user: any = req.user;
     const result = await BudgetService.getUserBudgetsByTypeFromDB(user.partnerId,user.id, req.query);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Budgets retrieved successfully',
          data: result,
     });
});

// Get yearly budget analytics
export const getYearlyBudgetAnalytics = catchAsync(async (req, res) => {
     const user: any = req.user;
     const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;

     const result = await BudgetService.getYearlyBudgetAnalyticsFromDB(user.id, year);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Budget analytics retrieved successfully',
          data: result,
     });
});

const updateBudget = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await BudgetService.updateBudgetToDB(id, req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Budget updated successfully',
          data: result,
     });
});

const deleteBudget = catchAsync(async (req, res) => {
     const { id } = req.params;
     await BudgetService.deleteBudgetFromDB(id);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Budget deleted successfully',
     });
});

export const BudgetController = {
     createBudget,
     getUserBudgets,
     getUserBudgetsByType,
     getYearlyBudgetAnalytics,
     updateBudget,
     deleteBudget,
};
