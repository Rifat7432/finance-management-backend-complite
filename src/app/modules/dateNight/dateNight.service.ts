import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { IDateNight } from './dateNight.interface';
import { DateNight } from './dateNight.model';
import { User } from '../user/user.model';
import { NotificationSettings } from '../notificationSettings/notificationSettings.model';
import { firebaseHelper } from '../../../helpers/firebaseHelper';
import { Notification } from '../notification/notification.model';
// import { IUserWithId } from '../../../types/auth';

export const createDateNightToDB = async (userId: string, payload: Partial<IDateNight>): Promise<IDateNight> => {
     // 1️⃣ Create the new Date Night document
     const newDateNight = await DateNight.create({
          ...payload,
          userId,
     });

     if (!newDateNight) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create date night');
     }

     // 2️⃣ Fetch user and user notification settings
     const user = await User.findById(userId);
     const userSetting = await NotificationSettings.findOne({ userId });

     // 3️⃣ Extract date and time safely
     const dateStr = newDateNight.date ? new Date(newDateNight.date).toLocaleDateString() : 'N/A';
     const timeStr = newDateNight.time || 'N/A';

     // 4️⃣ Send push notification (if allowed and device tokens exist)
     if (userSetting?.appointmentNotification) {
          const tokens = userSetting.deviceTokenList ?? [];

          if (tokens.length > 0) {
               await firebaseHelper.sendNotification(
                    [
                         {
                              id: String(userSetting.userId),
                              deviceToken: tokens[0],
                         },
                    ],
                    {
                         title: 'New Date Night Created',
                         body: `You planned a date night for ${dateStr} at ${timeStr}`,
                    },
                    tokens,
                    'multiple',
                    { dateNightId: String(newDateNight._id) },
               );
          }

          // 5️⃣ Create an in-app notification record
          await Notification.create({
               title: 'New Date Night Created',
               message: `You planned a date night for ${dateStr} at ${timeStr}`,
               receiver: userSetting.userId,
               type: 'DATE_NIGHT',
               read: false,
          });
     }

     const partnerId = user?.partnerId;
     if (!partnerId) {
          return newDateNight;
     }
     const partnerSetting = await NotificationSettings.findOne({ userId: partnerId });
     // 4️⃣ Send push notification (if allowed and device tokens exist)
     if (partnerSetting?.appointmentNotification) {
          const tokens = partnerSetting.deviceTokenList ?? [];

          if (tokens.length > 0) {
               await firebaseHelper.sendNotification(
                    [
                         {
                              id: String(partnerSetting.userId),
                              deviceToken: tokens[0],
                         },
                    ],
                    {
                         title: 'New Date Night Created',
                         body: `You planned a date night for ${dateStr} at ${timeStr}`,
                    },
                    tokens,
                    'multiple',
                    { dateNightId: String(newDateNight._id) },
               );
          }

          // 5️⃣ Create an in-app notification record
          await Notification.create({
               title: 'New Date Night Created',
               message: `You planned a date night for ${dateStr} at ${timeStr}`,
               receiver: partnerSetting.userId,
               type: 'DATE_NIGHT',
               read: false,
          });
     }

     return newDateNight;
};

const getDateNightsFromDB = async (userId: string): Promise<IDateNight[]> => {
     const user = await User.findById(userId);
     const dateNights = await DateNight.find({ userId, isDeleted: false });
     const PartnerDateNights = await DateNight.find({ userId: user?.partnerId, isDeleted: false });
     if (!dateNights.length) {
          throw new AppError(StatusCodes.NOT_FOUND, 'No date nights found');
     }
     return [...dateNights, ...PartnerDateNights];
};

const getSingleDateNightFromDB = async (id: string): Promise<IDateNight | null> => {
     const dateNight = await DateNight.findById(id);
     if (!dateNight) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Date night not found');
     }
     return dateNight;
};

const updateDateNightToDB = async (id: string, payload: Partial<IDateNight>): Promise<IDateNight | null> => {
     const dateNight = await DateNight.findById(id);
     if (!dateNight) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Date night not found');
     }
     const updated = await DateNight.findByIdAndUpdate(id, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update date night');
     }
     return updated;
};

const deleteDateNightFromDB = async (id: string): Promise<boolean> => {
     const dateNight = await DateNight.findById(id);
     if (!dateNight) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Date night not found');
     }
     const deleted = await DateNight.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
     if (!deleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Date night not found');
     }
     return true;
};

export const DateNightService = {
     createDateNightToDB,
     getDateNightsFromDB,
     getSingleDateNightFromDB,
     updateDateNightToDB,
     deleteDateNightFromDB,
};
