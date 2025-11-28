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
 * Convert a date + time + timezone to UTC Date
 * Uses Intl API for proper timezone conversion
 */
function getAppointmentUTC(date: Date, time: string, timeZone: string = 'Europe/London'): Date {
     const [hour, minute] = time.split(':').map(Number);

     // Create date string in the format: YYYY-MM-DD HH:mm
     const year = date.getFullYear();
     const month = String(date.getMonth() + 1).padStart(2, '0');
     const day = String(date.getDate()).padStart(2, '0');
     const dateTimeStr = `${year}-${month}-${day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

     // Parse as local time in the specified timezone, then convert to UTC
     const localDate = new Date(dateTimeStr);
     const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
     const tzDate = new Date(localDate.toLocaleString('en-US', { timeZone }));

     // Calculate offset and apply
     const offset = tzDate.getTime() - utcDate.getTime();
     return new Date(localDate.getTime() - offset);
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
     const now = new Date();
     const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

     // Add query timeout and limit results
     const events = await Model.find({
          isDeleted: false,
          date: { $gte: oneHourAgo },
     })
          .limit(100) // Process max 100 events per run
          .maxTimeMS(5000) // 5 second timeout
          .lean();

     console.log(`Processing ${events.length} ${collectionName} events`);

     for (const event of events) {
          try {
               const userSetting: any = await NotificationSettings.findOne({ userId: event.userId }).maxTimeMS(3000).lean();

               if (!userSetting) continue;

               // Check if notifications are enabled
               if ((collectionName === 'Appointment' && !userSetting.appointmentNotification) || (collectionName === 'DateNight' && !userSetting.dateNightNotification)) {
                    continue;
               }

               // Use user's timezone or default to UK time
               const timeZone = userSetting.timeZone || 'Europe/London';
               const appointmentUTC = getAppointmentUTC(new Date(event.date), event.time, timeZone);

               const diffMs = appointmentUTC.getTime() - now.getTime();
               const diffMin = diffMs / (60 * 1000);

               // Check if it's within 1 hour window (59-61 minutes)
               if (diffMin >= 59 && diffMin <= 61) {
                    // Check if notification already sent
                    const exists = await Notification.findOne({
                         [`meta.${identifierKey}`]: event._id,
                         receiver: event.userId,
                    }).maxTimeMS(3000);

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

cron.schedule('*/10 * * * *', async () => {
     await runReminderScheduler();
});
