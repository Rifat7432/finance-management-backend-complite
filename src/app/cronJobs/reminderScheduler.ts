import cron from 'node-cron';
import { Types } from 'mongoose';
import mongoose from 'mongoose';
import { firebaseHelper } from '../../helpers/firebaseHelper';
import { NotificationSettings } from '../modules/notificationSettings/notificationSettings.model';
import { Notification } from '../modules/notification/notification.model';
import { DateNight } from '../modules/dateNight/dateNight.model';
import { Appointment } from '../modules/appointment/appointment.model';
import { User } from '../modules/user/user.model';

// Prevent multiple simultaneous executions
let isProcessing = false;

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
     try {
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
     } catch (error) {
          console.error('Error sending notification:', error);
          throw error;
     }
}

/**
 * Generic function for sending reminders
 */
async function processReminders(collectionName: 'Appointment' | 'DateNight', Model: any, identifierKey: string) {
     // Get current time in milliseconds
     const now = new Date();
     // Get the UTC offset of Europe/London at this moment
     const ukOffsetMinutes = now.getTimezoneOffset() - new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' })).getTimezoneOffset();
     // Calculate current UK time as a Date object
     const nowUK = new Date(now.getTime() - ukOffsetMinutes * 60 * 1000);
     // Subtract 1 hour in milliseconds
     const oneHourAgoUK = new Date(nowUK.getTime() - 60 * 60 * 1000);
     const oneHourAfterUK = new Date(nowUK.getTime() + 1 * 60 * 60 * 1000);

     // Query MongoDB using UTCDate
     const events = await Model.find({
          isDeleted: false,
          UTCDate: { $gte: nowUK,$lte:oneHourAfterUK }, // compare with UK-based time in UTC
     })
          .limit(100)
          .maxTimeMS(5000)
          .lean();
console.log(nowUK,oneHourAgoUK,oneHourAfterUK);
     console.log(`Processing ${events.length} ${collectionName} events`);
     for (const event of events) {
          console.log(event.UTCDate,nowUK,oneHourAgoUK,oneHourAfterUK);
          try {
               const userSetting: any = await NotificationSettings.findOne({ userId: event.userId }).maxTimeMS(3000).lean();

               if (!userSetting) continue;
               console.log('pass 1');
               // Check if notifications are enabled
               if ((collectionName === 'Appointment' && !userSetting.appointmentNotification) || (collectionName === 'DateNight' && !userSetting.dateNightNotification)) {
                    continue;
               }
               console.log('pass 2');
               // Use user's timezone or default to UK time

               const appointmentUTC = event.UTCDate;
               const diffMs = appointmentUTC.getTime() - nowUK.getTime();
               const diffMin = diffMs / (60 * 1000);
               console.log(diffMin);
               // Check if it's within 1 hour window (59-61 minutes)
               if (diffMin >= 55 && diffMin <= 65) {
                    console.log('pass 3');
                    // Check if notification already sent
                    const exists = await Notification.findOne({
                         [`meta.${identifierKey}`]: event._id,
                         receiver: event.userId,
                    }).maxTimeMS(3000);
                    console.log(exists);
                    if (exists) continue;
                    console.log('pass 4');
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
                         type: collectionName,
                    });

                    // Send to partner for DateNight
                    if (collectionName === 'DateNight') {
                         const user = await User.findById(event.userId).maxTimeMS(3000);
                         const partnerId = user?.partnerId;

                         if (partnerId) {
                              const partnerSetting: any = await NotificationSettings.findOne({ userId: partnerId }).maxTimeMS(3000).lean();

                              // Fixed: Changed && to || in the condition
                              if (partnerSetting && partnerSetting.dateNightNotification) {
                                   // Check if partner already got notification
                                   const partnerExists = await Notification.findOne({
                                        [`meta.${identifierKey}`]: event._id,
                                        receiver: partnerId,
                                   }).maxTimeMS(3000);

                                   if (!partnerExists) {
                                        await sendNotificationAndSave({
                                             userSetting: partnerSetting,
                                             userId: partnerId,
                                             title,
                                             message,
                                             meta: { [identifierKey]: event._id },
                                             type: collectionName,
                                        });
                                   }
                              }
                         }
                    }

                    console.log(`✅ Notification sent for ${collectionName}: ${event._id}`);
               }
          } catch (error) {
               console.error(`Error processing ${collectionName} event ${event._id}:`, error);
               // Continue with next event instead of crashing
          }
     }
}

/**
 * Main scheduler function with connection check and concurrency control
 */
async function runReminderScheduler() {
     // Prevent concurrent executions
     if (isProcessing) {
          console.log('⏭️  Previous job still running, skipping...');
          return;
     }

     // Check database connection
     if (mongoose.connection.readyState !== 1) {
          console.error('❌ MongoDB not connected. ReadyState:', mongoose.connection.readyState);
          return;
     }

     isProcessing = true;
     const startTime = Date.now();

     try {
          console.log('🔔 Starting reminder scheduler...');
          await processReminders('DateNight', DateNight, 'dateNightId');
          await processReminders('Appointment', Appointment, 'appointmentId');
          console.log(`✅ Reminder scheduler completed in ${Date.now() - startTime}ms`);
     } catch (err) {
          console.error('❌ Reminder Scheduler error:', err);
     } finally {
          isProcessing = false;
     }
}

// cron.schedule('*/1 * * * *', async () => {
cron.schedule('*/10 * * * * *', async () => {
     await runReminderScheduler();
});
