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
const debt_model_1 = require("../modules/debt/debt.model");
const notificationSettings_model_1 = require("../modules/notificationSettings/notificationSettings.model");
const notification_model_1 = require("../modules/notification/notification.model");
const firebaseHelper_1 = require("../../helpers/firebaseHelper");
function getDebtUTC(date, time, timeZone) {
    const tz = timeZone || 'Europe/London';
    const [hour, minute] = time.split(':').map(Number);
    const localDate = new Date(date);
    localDate.setHours(hour, minute, 0, 0);
    const localString = localDate.toLocaleString('en-GB', { timeZone: tz });
    return new Date(localString);
}
function sendDebtNotification(_a) {
    return __awaiter(this, arguments, void 0, function* ({ userSetting, userId, debt }) {
        var _b;
        const title = 'Debt Payment Reminder';
        const message = `Your debt "${debt.name}" of amount ${debt.amount} is due on ${new Date(debt.payDueDate).toDateString()}.`;
        if (((_b = userSetting.deviceTokenList) === null || _b === void 0 ? void 0 : _b.length) > 0) {
            yield firebaseHelper_1.firebaseHelper.sendNotification([{ id: String(userId), deviceToken: userSetting.deviceTokenList[0] }], { title, body: message }, userSetting.deviceTokenList, 'multiple', {
                debtId: String(debt._id),
            });
        }
        yield notification_model_1.Notification.create({
            title,
            message,
            receiver: userId,
            type: 'ALERT',
            read: false,
        });
    });
}
node_cron_1.default.schedule('0 8 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const debts = yield debt_model_1.Debt.find({ isDeleted: false }).lean();
        for (const debt of debts) {
            const userSetting = yield notificationSettings_model_1.NotificationSettings.findOne({ userId: debt.userId }).lean();
            if (!(userSetting === null || userSetting === void 0 ? void 0 : userSetting.debtNotification))
                continue;
            const timeZone = userSetting.timeZone || 'Europe/London';
            const debtUTC = getDebtUTC(debt.payDueDate, '08:00', timeZone);
            const diffHours = (debtUTC.getTime() - now.getTime()) / (1000 * 60 * 60);
            // Send 24 hours before
            if (diffHours >= 23.9 && diffHours <= 24.1) {
                yield sendDebtNotification({ userSetting, userId: debt.userId, debt });
                console.log(`✅ Debt reminder sent: ${debt.name}`);
            }
        }
    }
    catch (err) {
        console.error('❌ Debt reminder error:', err);
    }
}));
