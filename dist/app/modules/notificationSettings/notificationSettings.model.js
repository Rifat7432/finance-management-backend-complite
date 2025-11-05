"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSettings = void 0;
const mongoose_1 = require("mongoose");
const notificationSettingsSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    budgetNotification: { type: Boolean, default: true },
    contentNotification: { type: Boolean, default: true },
    appointmentNotification: { type: Boolean, default: true },
    debtNotification: { type: Boolean, default: true },
    dateNightNotification: { type: Boolean, default: true },
    deviceTokenList: { type: [String], default: [] },
}, { timestamps: true });
exports.NotificationSettings = (0, mongoose_1.model)('NotificationSettings', notificationSettingsSchema);
