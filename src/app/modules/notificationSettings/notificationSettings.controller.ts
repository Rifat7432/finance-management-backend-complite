import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { NotificationSettingsService } from './notificationSettings.service';

const getNotificationSettings = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await NotificationSettingsService.getNotificationSettingsFromDB(userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Notification settings retrieved successfully',
          data: result,
     });
});

const updateNotificationSettings = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await NotificationSettingsService.updateNotificationSettingsToDB(userId, req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Notification settings updated successfully',
          data: result,
     });
});

export const NotificationSettingsController = {
     getNotificationSettings,
     updateNotificationSettings,
};
