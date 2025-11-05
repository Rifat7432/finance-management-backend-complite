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
exports.DateNightService = exports.createDateNightToDB = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const dateNight_model_1 = require("./dateNight.model");
const user_model_1 = require("../user/user.model");
const notificationSettings_model_1 = require("../notificationSettings/notificationSettings.model");
const firebaseHelper_1 = require("../../../helpers/firebaseHelper");
const notification_model_1 = require("../notification/notification.model");
// import { IUserWithId } from '../../../types/auth';
const createDateNightToDB = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // 1️⃣ Create the new Date Night document
    const newDateNight = yield dateNight_model_1.DateNight.create(Object.assign(Object.assign({}, payload), { userId }));
    if (!newDateNight) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create date night');
    }
    // 2️⃣ Fetch user and user notification settings
    const user = yield user_model_1.User.findById(userId);
    const userSetting = yield notificationSettings_model_1.NotificationSettings.findOne({ userId });
    // 3️⃣ Extract date and time safely
    const dateStr = newDateNight.date ? new Date(newDateNight.date).toLocaleDateString() : 'N/A';
    const timeStr = newDateNight.time || 'N/A';
    // 4️⃣ Send push notification (if allowed and device tokens exist)
    if (userSetting === null || userSetting === void 0 ? void 0 : userSetting.appointmentNotification) {
        const tokens = (_a = userSetting.deviceTokenList) !== null && _a !== void 0 ? _a : [];
        if (tokens.length > 0) {
            yield firebaseHelper_1.firebaseHelper.sendNotification([
                {
                    id: String(userSetting.userId),
                    deviceToken: tokens[0],
                },
            ], {
                title: 'New Date Night Created',
                body: `You planned a date night for ${dateStr} at ${timeStr}`,
            }, tokens, 'multiple', { dateNightId: String(newDateNight._id) });
        }
        // 5️⃣ Create an in-app notification record
        yield notification_model_1.Notification.create({
            title: 'New Date Night Created',
            message: `You planned a date night for ${dateStr} at ${timeStr}`,
            receiver: userSetting.userId,
            type: 'DATE_NIGHT',
            read: false,
        });
    }
    const partnerId = user === null || user === void 0 ? void 0 : user.partnerId;
    if (!partnerId) {
        return newDateNight;
    }
    const partnerSetting = yield notificationSettings_model_1.NotificationSettings.findOne({ userId: partnerId });
    // 4️⃣ Send push notification (if allowed and device tokens exist)
    if (partnerSetting === null || partnerSetting === void 0 ? void 0 : partnerSetting.appointmentNotification) {
        const tokens = (_b = partnerSetting.deviceTokenList) !== null && _b !== void 0 ? _b : [];
        if (tokens.length > 0) {
            yield firebaseHelper_1.firebaseHelper.sendNotification([
                {
                    id: String(partnerSetting.userId),
                    deviceToken: tokens[0],
                },
            ], {
                title: 'New Date Night Created',
                body: `You planned a date night for ${dateStr} at ${timeStr}`,
            }, tokens, 'multiple', { dateNightId: String(newDateNight._id) });
        }
        // 5️⃣ Create an in-app notification record
        yield notification_model_1.Notification.create({
            title: 'New Date Night Created',
            message: `You planned a date night for ${dateStr} at ${timeStr}`,
            receiver: partnerSetting.userId,
            type: 'DATE_NIGHT',
            read: false,
        });
    }
    return newDateNight;
});
exports.createDateNightToDB = createDateNightToDB;
const getDateNightsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    const dateNights = yield dateNight_model_1.DateNight.find({ userId, isDeleted: false });
    const PartnerDateNights = yield dateNight_model_1.DateNight.find({ userId: user === null || user === void 0 ? void 0 : user.partnerId, isDeleted: false });
    if (!dateNights.length) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No date nights found');
    }
    return [...dateNights, ...PartnerDateNights];
});
const getSingleDateNightFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const dateNight = yield dateNight_model_1.DateNight.findById(id);
    if (!dateNight) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Date night not found');
    }
    return dateNight;
});
const updateDateNightToDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const dateNight = yield dateNight_model_1.DateNight.findById(id);
    if (!dateNight) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Date night not found');
    }
    const updated = yield dateNight_model_1.DateNight.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update date night');
    }
    return updated;
});
const deleteDateNightFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const dateNight = yield dateNight_model_1.DateNight.findById(id);
    if (!dateNight) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Date night not found');
    }
    const deleted = yield dateNight_model_1.DateNight.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!deleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Date night not found');
    }
    return true;
});
exports.DateNightService = {
    createDateNightToDB: exports.createDateNightToDB,
    getDateNightsFromDB,
    getSingleDateNightFromDB,
    updateDateNightToDB,
    deleteDateNightFromDB,
};
