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
const firebaseHelper_1 = require("../../helpers/firebaseHelper");
const notificationSettings_model_1 = require("../modules/notificationSettings/notificationSettings.model");
const notification_model_1 = require("../modules/notification/notification.model");
const dateNight_model_1 = require("../modules/dateNight/dateNight.model");
const appointment_model_1 = require("../modules/appointment/appointment.model");
const user_model_1 = require("../modules/user/user.model");
/**
 * Convert a date + time + timezone to UTC Date
 * Defaults to UK timezone if none provided
 */
function getAppointmentUTC(date, time, timeZone) {
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
function sendNotificationAndSave(_a) {
    return __awaiter(this, arguments, void 0, function* ({ userSetting, userId, title, message, meta, type, }) {
        var _b;
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
    });
}
/**
 * Generic function for sending reminders
 */
function processReminders(collectionName, Model, identifierKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date();
        const events = yield Model.find({
            isDeleted: false,
            date: { $gte: new Date(now.getTime() - 60 * 60 * 1000) }, // only recent/future
        }).lean();
        for (const event of events) {
            const userSetting = yield notificationSettings_model_1.NotificationSettings.findOne({ userId: event.userId }).lean();
            if (!userSetting)
                continue;
            if ((collectionName === 'Appointment' && !userSetting.appointmentNotification) || (collectionName === 'DateNight' && !userSetting.dateNightNotification))
                continue;
            // Use user's timezone or default to UK time
            const timeZone = userSetting.timeZone || 'Europe/London';
            const appointmentUTC = getAppointmentUTC(new Date(event.date), event.time, timeZone);
            const diffMs = appointmentUTC.getTime() - now.getTime();
            const diffMin = diffMs / (60 * 1000);
            if (diffMin >= 59 && diffMin <= 61) {
                const exists = yield notification_model_1.Notification.findOne({
                    [`meta.${identifierKey}`]: event._id,
                    receiver: event.userId,
                });
                if (exists)
                    continue;
                const title = collectionName === 'DateNight' ? 'Date Night Reminder' : 'Appointment Reminder';
                const message = collectionName === 'DateNight'
                    ? `Your plan "${event.plan}" at ${event.time} on ${new Date(event.date).toDateString()} is coming up in 1 hour!`
                    : `Your appointment scheduled at ${event.time} on ${new Date(event.date).toDateString()} is coming up in 1 hour!`;
                yield sendNotificationAndSave({
                    userSetting,
                    userId: event.userId,
                    title,
                    message,
                    meta: { [identifierKey]: event._id },
                });
                if (collectionName === 'DateNight') {
                    const user = yield user_model_1.User.findById(event.userId);
                    const partnerId = user === null || user === void 0 ? void 0 : user.partnerId;
                    const partnerSetting = yield notificationSettings_model_1.NotificationSettings.findOne({ userId: partnerId }).lean();
                    if (!partnerSetting && !partnerSetting.dateNightNotification)
                        continue;
                    yield sendNotificationAndSave({
                        userSetting: partnerSetting,
                        userId: partnerId,
                        title,
                        message,
                        meta: { [identifierKey]: event._id },
                    });
                }
                console.log(`✅ Notification sent for ${collectionName}: ${event._id}`);
            }
        }
    });
}
/**
 * Start the reminder scheduler
 */
node_cron_1.default.schedule('* * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield processReminders('DateNight', dateNight_model_1.DateNight, 'dateNightId');
        yield processReminders('Appointment', appointment_model_1.Appointment, 'appointmentId');
    }
    catch (err) {
        console.error('❌ Reminder Scheduler error:', err);
    }
}));
