import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from './notification.service';

// ✅ Get user notifications
const getUserNotifications = catchAsync(async (req: Request, res: Response) => {
  const user: any = req.user;
  const result = await NotificationService.getNotificationFromDB(user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User notifications retrieved successfully',
    data: result,
  });
});

// ✅ Mark user notifications as read
const markUserNotificationsAsRead = catchAsync(async (req: Request, res: Response) => {
  const user: any = req.user;
  const result = await NotificationService.readNotificationToDB(user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User notifications marked as read',
    data: result,
  });
});


export const NotificationController = {
  getUserNotifications,
  markUserNotificationsAsRead,

};
