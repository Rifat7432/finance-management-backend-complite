import cron from 'node-cron';
import { Types } from 'mongoose';
import { firebaseHelper } from '../../helpers/firebaseHelper';
import { NotificationSettings } from '../modules/notificationSettings/notificationSettings.model';
import { Notification } from '../modules/notification/notification.model';
import { DateNight } from '../modules/dateNight/dateNight.model';
import { Appointment } from '../modules/appointment/appointment.model';
import { User } from '../modules/user/user.model';

/**
 * Convert a date + time + timezone to UTC Date
 * Defaults to UK timezone if none provided
 */
function getAppointmentUTC(date: Date, time: string, timeZone?: string): Date {
     const tz = timeZone || 'Europe/London'; // default to UK time
     const [hour, minute] = time.split(':').map(Number);
     const appointmentLocal = new Date(date);
     appointmentLocal.setHours(hour, minute, 0, 0);

     // Convert local time to UTC based on timezone
     const localString = appointmentLocal.toLocaleString('en-GB', { timeZone: tz });
     return new Date(localString);
}

/**
 * Helper: Sends both Firebase + DB notification safely
 */
async function sendNotificationAndSave({
     userSetting,
     userId,
     title,
     message,
     meta,
     type,
}: {
     userSetting: any;
     userId: Types.ObjectId;
     title: string;
     message: string;
     meta: Record<string, any>;
     type?: string;
}) {
     if (userSetting.deviceTokenList?.length > 0) {
          await firebaseHelper.sendNotification([{ id: String(userId), deviceToken: userSetting.deviceTokenList[0] }], { title, body: message }, userSetting.deviceTokenList, 'multiple', meta);
     }

     await Notification.create({
          title,
          message,
          receiver: userId,
          type: type === 'Appointment' ? 'APPOINTMENT' : 'ALERT',
          read: false,
          meta,
     });
}

/**
 * Generic function for sending reminders
 */
async function processReminders(collectionName: 'Appointment' | 'DateNight', Model: any, identifierKey: string) {
     const now = new Date();

     const events = await Model.find({
          isDeleted: false,
          date: { $gte: new Date(now.getTime() - 60 * 60 * 1000) }, // only recent/future
     }).lean();

     for (const event of events) {
          const userSetting: any = await NotificationSettings.findOne({ userId: event.userId }).lean();
          if (!userSetting) continue;

          if ((collectionName === 'Appointment' && !userSetting.appointmentNotification) || (collectionName === 'DateNight' && !userSetting.dateNightNotification)) continue;

          // Use user's timezone or default to UK time
          const timeZone = userSetting.timeZone || 'Europe/London';
          const appointmentUTC = getAppointmentUTC(new Date(event.date), event.time, timeZone);

          const diffMs = appointmentUTC.getTime() - now.getTime();
          const diffMin = diffMs / (60 * 1000);

          if (diffMin >= 59 && diffMin <= 61) {
               const exists = await Notification.findOne({
                    [`meta.${identifierKey}`]: event._id,
                    receiver: event.userId,
               });
               if (exists) continue;

               const title = collectionName === 'DateNight' ? 'Date Night Reminder' : 'Appointment Reminder';

               const message =
                    collectionName === 'DateNight'
                         ? `Your plan "${event.plan}" at ${event.time} on ${new Date(event.date).toDateString()} is coming up in 1 hour!`
                         : `Your appointment scheduled at ${event.time} on ${new Date(event.date).toDateString()} is coming up in 1 hour!`;

               await sendNotificationAndSave({
                    userSetting,
                    userId: event.userId,
                    title,
                    message,
                    meta: { [identifierKey]: event._id },
               });
               if (collectionName === 'DateNight') {
                    const user = await User.findById(event.userId);
                    const partnerId = user?.partnerId;

                    const partnerSetting: any = await NotificationSettings.findOne({ userId: partnerId }).lean();
                    if (!partnerSetting && !partnerSetting.dateNightNotification) continue;
                    await sendNotificationAndSave({
                         userSetting: partnerSetting,
                         userId: partnerId!,
                         title,
                         message,
                         meta: { [identifierKey]: event._id },
                    });
               }
               console.log(`✅ Notification sent for ${collectionName}: ${event._id}`);
          }
     }
}

/**
 * Start the reminder scheduler
 */

cron.schedule('* * * * *', async () => {
     try {
          await processReminders('DateNight', DateNight, 'dateNightId');
          await processReminders('Appointment', Appointment, 'appointmentId');
     } catch (err) {
          console.error('❌ Reminder Scheduler error:', err);
     }
});
