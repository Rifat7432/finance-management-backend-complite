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
const dateTimeHelper_1 = require("../../utils/dateTimeHelper");
function getDebtUTC(date, time, timeZone) {
    const [hour, minute] = time.split(':').map(Number);
    const utcDate = (0, dateTimeHelper_1.toUTC)(date);
    utcDate.setHours(hour, minute, 0, 0);
    return utcDate;
}
function addOneMonth(dateStr) {
    const date = new Date(dateStr); // YYYY-MM-DD
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    // Create new date +1 month
    const nextDate = new Date(year, month + 1, day);
    // Format YYYY-MM-DD
    const yyyy = nextDate.getFullYear();
    const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
    const dd = String(nextDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
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
node_cron_1.default.schedule('0 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    const nowUTC = (0, dateTimeHelper_1.getCurrentUTC)();
    try {
        const todayString = nowUTC
            .toISOString()
            .split('T')[0];
        const debts = yield debt_model_1.Debt.find({
            isDeleted: false,
            completionRatio: { $lt: 100 },
            payDueDate: todayString,
        });
        for (const debt of debts) {
            const userSetting = yield notificationSettings_model_1.NotificationSettings.findOne({ userId: debt.userId }).lean();
            if (!(userSetting === null || userSetting === void 0 ? void 0 : userSetting.debtNotification))
                continue;
            const debtUTC = getDebtUTC(debt.payDueDate, '08:00', userSetting.timeZone);
            const diffMs = debtUTC.getTime() - nowUTC.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            if (diffHours >= 23.9 && diffHours <= 24.1) {
                yield sendDebtNotification({ userSetting, userId: debt.userId, debt });
                console.log(`✅ Debt reminder sent: ${debt.name}`);
            }
            const totalToDeduct = (debt.monthlyPayment || 0) + (debt.AdHocPayment || 0) + (debt.capitalRepayment || 0) + (debt.interestRepayment || 0);
            const newAmount = Math.max(debt.amount - totalToDeduct, 0);
            const completionRatio = debt.amount > 0 ? Number((((debt.amount - newAmount) / debt.amount) * 100).toFixed(2)) : 0;
            const nextPayDate = addOneMonth(debt.payDueDate);
            yield debt_model_1.Debt.updateOne({ _id: debt._id }, {
                // amount: newAmount,
                completionRatio,
                payDueDate: nextPayDate,
            });
            console.log(`✔ Debt updated for: ${debt.name}`);
        }
    }
    catch (error) {
        console.error('❌ Debt completion update error:', error);
    }
}), { timezone: 'UTC' });
