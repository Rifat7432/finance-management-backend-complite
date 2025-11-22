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
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const socketHelper_1 = require("../../../helpers/socketHelper");
const logger_1 = require("../../../shared/logger");
const colors_1 = __importDefault(require("colors"));
var NotificationType;
(function (NotificationType) {
    NotificationType["ADMIN"] = "ADMIN";
    NotificationType["SYSTEM"] = "SYSTEM";
    NotificationType["PAYMENT"] = "PAYMENT";
    NotificationType["ALERT"] = "ALERT";
    NotificationType["ORDER"] = "APPOINTMENT";
    NotificationType["CANCELLED"] = "CANCELLED";
})(NotificationType || (NotificationType = {}));
const notificationSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: false,
        default: 'Notification',
    },
    message: {
        type: String,
        required: true,
    },
    receiver: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    read: {
        type: Boolean,
        default: false,
        index: true,
    },
    type: {
        type: String,
        enum: Object.values(NotificationType),
        required: true,
    },
}, {
    timestamps: true,
});
notificationSchema.index({ receiver: 1, read: 1 });
notificationSchema.post('save', function (doc) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!socketHelper_1.socketIo) {
                logger_1.logger.warn(colors_1.default.yellow('Socket.IO is not initialized'));
                return;
            }
            const notification = doc.toObject();
            const receiverId = notification.receiver.toString();
            logger_1.logger.info(colors_1.default.green(`Sending notification to user ${receiverId}`));
            socketHelper_1.socketIo.to(receiverId).emit('notification', notification);
        }
        catch (error) {
            logger_1.logger.error(colors_1.default.red('Failed to send socket notification'), error);
        }
    });
});
exports.Notification = (0, mongoose_1.model)('Notification', notificationSchema);
