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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentService = void 0;
const http_status_codes_1 = require("http-status-codes");
const appointment_model_1 = require("./appointment.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const notificationSettings_model_1 = require("../notificationSettings/notificationSettings.model");
const notification_model_1 = require("../notification/notification.model");
const firebaseHelper_1 = require("../../../helpers/firebaseHelper");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const createAppointmentToDB = (data, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { date, timeSlot } = data, rest = __rest(data, ["date", "timeSlot"]);
    if (!date || !timeSlot) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Date and timeSlot are required');
    }
    // Example input: "10:00 AM - 11:00 AM"
    const [startTimeRaw, endTimeRaw] = timeSlot.split(' - ').map((time) => time.trim());
    // Convert "10:00 AM" to "10:00" (24-hour format) for validation
    const to24Hour = (timeStr) => {
        const dateObj = new Date(`1970-01-01T${timeStr}`);
        if (!isNaN(dateObj.getTime())) {
            return dateObj.toTimeString().slice(0, 8);
        }
        // Try parsing with AM/PM
        const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (match) {
            let hour = parseInt(match[1], 10);
            const minute = match[2];
            const ampm = match[3].toUpperCase();
            if (ampm === 'PM' && hour < 12)
                hour += 12;
            if (ampm === 'AM' && hour === 12)
                hour = 0;
            return `${hour.toString().padStart(2, '0')}:${minute}:00`;
        }
        return null;
    };
    const startTime = to24Hour(startTimeRaw);
    const endTime = to24Hour(endTimeRaw);
    if (!startTime || !endTime) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid time format (expected HH:mm or HH:mm:ss or HH:mm AM/PM)');
    }
    // Validate date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid date format');
    }
    // Check if an appointment already exists for the given date and timeSlot
    const existingAppointment = yield appointment_model_1.Appointment.findOne({ date, timeSlot });
    if (existingAppointment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Time slot already booked');
    }
    // Create the appointment
    const appointment = yield appointment_model_1.Appointment.create(Object.assign(Object.assign({}, data), { userId }));
    // Send notification only to the user who booked the appointment, if their settings allow
    const userSetting = yield notificationSettings_model_1.NotificationSettings.findOne({ userId });
    if (userSetting === null || userSetting === void 0 ? void 0 : userSetting.appointmentNotification) {
        if (userSetting.deviceTokenList && userSetting.deviceTokenList.length > 0) {
            yield firebaseHelper_1.firebaseHelper.sendNotification([{ id: String(userSetting.userId), deviceToken: userSetting.deviceTokenList[0] }], {
                title: 'New Appointment Booked',
                body: `Appointment booked for ${date} at ${timeSlot}`,
            }, userSetting.deviceTokenList, 'multiple', { appointmentId: String(appointment._id) });
        }
        yield notification_model_1.Notification.create({
            title: 'New Appointment Booked',
            message: `Appointment booked for ${date} at ${timeSlot}`,
            receiver: userSetting.userId,
            type: 'APPOINTMENT',
            read: false,
        });
    }
    return appointment;
});
const getUserAppointmentsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const appointments = yield appointment_model_1.Appointment.find({ userId });
    if (!appointments.length) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No appointments found for this user');
    }
    return appointments;
});
const getAllAppointmentsFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    // const appointments = await Appointment.find().populate('userId','name email image');
    const appointments = new QueryBuilder_1.default(appointment_model_1.Appointment.find(), query).search(['name', 'email']).filter().sort().fields().modelQuery.populate('userId', 'name email image');
    return appointments;
});
const getSingleAppointmentFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const appointment = yield appointment_model_1.Appointment.findById(id);
    if (!appointment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Appointment not found');
    }
    return appointment;
});
const updateAppointmentToDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Retrieve the existing appointment
    const appointment = yield appointment_model_1.Appointment.findById(id);
    if (!appointment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Appointment not found');
    }
    // Handle case where appointment time or date is updated
    const newDate = payload.date;
    const newTime = payload.time;
    const oldDate = appointment.get('date');
    const oldTime = appointment.get('time');
    // If the date or time is updated, validate and check for double booking
    if (newDate || newTime) {
        // Validate new date if provided
        if (newDate) {
            const parsedDate = new Date(newDate);
            if (isNaN(parsedDate.getTime())) {
                throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid date format');
            }
        }
        // Validate new time if provided
        if (newTime) {
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
            if (!timeRegex.test(newTime)) {
                throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid time format (expected HH:mm or HH:mm:ss)');
            }
        }
        // Check if another appointment already exists for the new date and time
        const checkDate = newDate || oldDate;
        const checkTime = newTime || oldTime;
        const existingAppointment = yield appointment_model_1.Appointment.findOne({ date: checkDate, time: checkTime, _id: { $ne: id } });
        if (existingAppointment) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Time slot already booked');
        }
        // Update the appointment with new details
        appointment.set('date', newDate || oldDate);
        appointment.set('time', newTime || oldTime);
        const updatedAppointment = yield appointment.save();
        return updatedAppointment;
    }
    // If the date and time are not updated, simply update other fields
    const updated = yield appointment_model_1.Appointment.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update appointment');
    }
    return updated;
});
const deleteAppointmentFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const deleted = yield appointment_model_1.Appointment.findByIdAndDelete(id);
    if (!deleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Appointment not found');
    }
    return true;
});
exports.AppointmentService = {
    createAppointmentToDB,
    getUserAppointmentsFromDB,
    getSingleAppointmentFromDB,
    updateAppointmentToDB,
    deleteAppointmentFromDB,
    getAllAppointmentsFromDB,
};
