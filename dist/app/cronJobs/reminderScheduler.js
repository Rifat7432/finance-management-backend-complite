"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const mongoose_1 = __importDefault(require("mongoose"));
const firebaseHelper_1 = require("../../helpers/firebaseHelper");
const notificationSettings_model_1 = require("../modules/notificationSettings/notificationSettings.model");
const notification_model_1 = require("../modules/notification/notification.model");
const dateNight_model_1 = require("../modules/dateNight/dateNight.model");
const appointment_model_1 = require("../modules/appointment/appointment.model");
const user_model_1 = require("../modules/user/user.model");
const dateTimeHelper_1 = require("../../utils/dateTimeHelper");
// Prevent multiple simultaneous executions
let isProcessing = false;
/**
 * Helper: Sends both Firebase + DB notification safely
 */
function sendNotificationAndSave(_a) {
    return __awaiter(this, arguments, void 0, function* ({ userSetting, userId, title, message, meta, type, }) {
        var _b;
        try {
            if (((_b = userSetting.deviceTokenList) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                yield firebaseHelper_1.firebaseHelper.sendNotification([{ id: String(userId), deviceToken: userSetting.deviceTokenList[0] }], { title, body: message }, userSetting.deviceTokenList, 'multiple', meta);
            }
            yield notification_model_1.Notification.create({
                title,
                message,
                receiver: userId,
                type: type === 'Appointment' ? 'APPOINTMENT' : 'ALERT',
                read: false,
                meta,
            });
        }
        catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    });
}
/**
 * Generic function for sending reminders
 */
function processReminders(collectionName, Model, identifierKey) {
    return __awaiter(this, void 0, void 0, function* () {
        // Get current UTC time
        const nowUTC = (0, dateTimeHelper_1.getCurrentUTC)();
        // Calculate 59 and 61 minutes in the future
        const oneHourAfterUTC = new Date(nowUTC.getTime() + 59 * 60 * 1000);
        const oneHourOneMinuteAfterUTC = new Date(nowUTC.getTime() + 60 * 60 * 1000);
        console.log(nowUTC, oneHourAfterUTC, oneHourOneMinuteAfterUTC);
        // Query MongoDB using UTCDate
        const events = yield Model.find({
            isDeleted: false,
            isRemainderSent: false,
            UTCDate: { $gte: oneHourAfterUTC, $lte: oneHourOneMinuteAfterUTC },
        })
            .limit(100)
            .maxTimeMS(5000)
            .lean();
        console.log(`Processing ${events.length} ${collectionName} events`);
        for (const event of events) {
            try {
                const userSetting = yield notificationSettings_model_1.NotificationSettings.findOne({ userId: event.userId }).maxTimeMS(3000).lean();
                if (!userSetting)
                    continue;
                // Check if notifications are enabled
                if ((collectionName === 'Appointment' && !userSetting.appointmentNotification) || (collectionName === 'DateNight' && !userSetting.dateNightNotification)) {
                    continue;
                }
                const appointmentUTC = event.UTCDate;
                const diffMs = appointmentUTC.getTime() - nowUTC.getTime();
                const diffMin = diffMs / (60 * 1000);
                // Check if it's within 1 hour window (59-61 minutes)
                if (diffMin > 59 && diffMin < 61) {
                    const title = collectionName === 'DateNight' ? 'Date Night Reminder' : 'Appointment Reminder';
                    const message = collectionName === 'DateNight'
                        ? `Your plan "${event.plan}" at ${event.time} on ${new Date(event.date).toDateString()} is coming up in 1 hour!`
                        : `Your appointment scheduled at ${event.timeSlot} on ${new Date(event.date).toDateString()} is coming up in 1 hour!`;
                    yield sendNotificationAndSave({
                        userSetting,
                        userId: event.userId,
                        title,
                        message,
                        meta: { [identifierKey]: event._id },
                        type: collectionName,
                    });
                    // Send to partner for DateNight
                    if (collectionName === 'DateNight') {
                        const user = yield user_model_1.User.findById(event.userId).maxTimeMS(3000);
                        const partnerId = user === null || user === void 0 ? void 0 : user.partnerId;
                        if (partnerId) {
                            const partnerSetting = yield notificationSettings_model_1.NotificationSettings.findOne({ userId: partnerId }).maxTimeMS(3000).lean();
                            // Fixed: Changed && to || in the condition
                            if (partnerSetting && partnerSetting.dateNightNotification) {
                                // Check if partner already got notification
                                yield sendNotificationAndSave({
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
                    yield Model.updateOne({ _id: event._id }, { $set: { isRemainderSent: true } })
                        .maxTimeMS(3000)
                        .exec();
                    console.log(`✅ Notification sent for ${collectionName}: ${event._id}`);
                }
            }
            catch (error) {
                console.error(`Error processing ${collectionName} event ${event._id}:`, error);
                // Continue with next event instead of crashing
            }
        }
    });
}
/**
 * Main scheduler function with connection check and concurrency control
 */
function runReminderScheduler() {
    return __awaiter(this, void 0, void 0, function* () {
        // Prevent concurrent executions
        if (isProcessing) {
            console.log('⏭️  Previous job still running, skipping...');
            return;
        }
        // Check database connection
        if (mongoose_1.default.connection.readyState !== 1) {
            console.error('❌ MongoDB not connected. ReadyState:', mongoose_1.default.connection.readyState);
            return;
        }
        isProcessing = true;
        const startTime = Date.now();
        try {
            console.log('🔔 Starting reminder scheduler...');
            yield processReminders('DateNight', dateNight_model_1.DateNight, 'dateNightId');
            yield processReminders('Appointment', appointment_model_1.Appointment, 'appointmentId');
            console.log(`✅ Reminder scheduler completed in ${Date.now() - startTime}ms`);
        }
        catch (err) {
            console.error('❌ Reminder Scheduler error:', err);
        }
        finally {
            isProcessing = false;
        }
    });
}
node_cron_1.default.schedule('*/1 * * * *', 
// '*/10 * * * * *',
() => __awaiter(void 0, void 0, void 0, function* () {
    yield runReminderScheduler();
}), { timezone: 'UTC' });
