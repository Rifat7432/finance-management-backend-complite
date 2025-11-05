import { Types } from 'mongoose';

export interface INotificationSetting {
     userId: Types.ObjectId;
     budgetNotification: boolean;
     contentNotification: boolean;
     appointmentNotification: boolean;
     debtNotification: boolean;
     dateNightNotification: boolean;
     deviceTokenList: string[];
}
