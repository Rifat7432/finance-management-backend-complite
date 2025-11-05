import { StatusCodes } from 'http-status-codes';
import { NotificationSettings } from './notificationSettings.model';
import { INotificationSetting } from './notificationSettings.interface';
import AppError from '../../../errors/AppError';

const getNotificationSettingsFromDB = async (userId: string): Promise<INotificationSetting | null> => {
  const settings = await NotificationSettings.findOne({ userId });
  if (!settings) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Notification settings not found');
  }
  return settings;
};

const updateNotificationSettingsToDB = async (userId: string, payload: Partial<INotificationSetting>): Promise<INotificationSetting | null> => {
  const updated = await NotificationSettings.findOneAndUpdate({ userId }, payload, { new: true });
  if (!updated) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update notification settings');
  }
  return updated;
};


export const NotificationSettingsService = {
  getNotificationSettingsFromDB,
  updateNotificationSettingsToDB,
};
