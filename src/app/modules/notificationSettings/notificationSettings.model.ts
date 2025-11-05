import { Schema, model } from 'mongoose';
import { INotificationSetting } from './notificationSettings.interface';

const notificationSettingsSchema = new Schema<INotificationSetting>(
     {
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
          budgetNotification: { type: Boolean, default: true },
          contentNotification: { type: Boolean, default: true },
          appointmentNotification: { type: Boolean, default: true },
          debtNotification: { type: Boolean, default: true },
          dateNightNotification: { type: Boolean, default: true },
          deviceTokenList: { type: [String], default: [] },
     },
     { timestamps: true },
);

export const NotificationSettings = model<INotificationSetting>('NotificationSettings', notificationSettingsSchema);
