import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AnalyticsService } from './analytics.service';
const getAnalytics = catchAsync(async (req, res) => {
     const userId = req.user?.id;
     const data = await AnalyticsService.getAnalyticsFromDB(userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Analytics retrieved successfully',
          data: data,
     });
});
const getLatestUpdate = catchAsync(async (req, res) => {
     const userId = req.user?.id;
     const data = await AnalyticsService.getLatestUpdateFromDB(userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Last updates retrieved successfully',
          data: data,
     });
});

export const AnalyticsController = {
     getAnalytics,getLatestUpdate
};
