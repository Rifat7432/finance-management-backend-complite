import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AdminService } from './admin.service';
const getUserFinancialOverview = catchAsync(async (req: Request, res: Response) => {
     const result = await AdminService.getUserFinancialOverviewFromDB(req.query.searchTerm as string, req.query.page ? Number(req.query.page) : 1, req.query.limit ? Number(req.query.limit) : 10);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'User financial Data retrieved',
          data: result,
     });
});
const getMonthlyExpenseAnalytics = catchAsync(async (req: Request, res: Response) => {
     const result = await AdminService.getMonthlyExpenseAnalyticsFromDB(req.params.userId);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'User monthly expenses details retrieved',
          data: result,
     });
});
const updateAppointmentStatus = catchAsync(async (req: Request, res: Response) => {
     const result = await AdminService.updateAppointmentStatusIntoDB(req.params.userId);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Appointment completed',
          data: result,
     });
});
const getNotificationSettings = catchAsync(async (req: Request, res: Response) => {
     const result = await AdminService.getNotificationSettingsFromDB(req.params.userId);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Notification settings retrieved',
          data: result,
     });
});
const updateNotificationSettings = catchAsync(async (req: Request, res: Response) => {
     const result = await AdminService.updateNotificationSettingsToDB(req.params.userId, req.body);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Settings updated',
          data: result,
     });
});
const getAdminRevenue = catchAsync(async (req, res) => {
     const result = await AdminService.getAdminDashboardStats(Number(req.query.year));
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Dashboard data retrieved',
          data: result,
     });
});
export const AdminController = {
     getUserFinancialOverview,
     getMonthlyExpenseAnalytics,
     updateAppointmentStatus,
     getNotificationSettings,
     updateNotificationSettings,
     getAdminRevenue,
};
