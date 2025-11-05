"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.firebaseHelper = void 0;
const admin = __importStar(require("firebase-admin"));
const logger_1 = require("../shared/logger");
const finace_management_72997_firebase_adminsdk_fbsvc_4bf112f98e_json_1 = __importDefault(require("../../finace-management-72997-firebase-adminsdk-fbsvc-4bf112f98e.json"));
const serviceAccountKey = finace_management_72997_firebase_adminsdk_fbsvc_4bf112f98e_json_1.default;
admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
});
const sendNotification = (users_1, message_1, deviceTokens_1, ...args_1) => __awaiter(void 0, [users_1, message_1, deviceTokens_1, ...args_1], void 0, function* (users, message, deviceTokens, type = 'multiple', data = {}) {
    var _a;
    let tokens = [];
    if (type === 'single') {
        const token = (deviceTokens === null || deviceTokens === void 0 ? void 0 : deviceTokens[0]) || (Array.isArray(users) ? (_a = users[0]) === null || _a === void 0 ? void 0 : _a.deviceToken : users.deviceToken);
        if (!token) {
            logger_1.logger.warn('No device token provided for single notification');
            return;
        }
        try {
            const response = yield admin.messaging().send({
                notification: message,
                data,
                token,
            });
            logger_1.logger.info('Single notification sent successfully', response);
        }
        catch (err) {
            logger_1.logger.error('Error sending single push notification', err);
        }
    }
    else {
        // multiple
        tokens = deviceTokens || (Array.isArray(users) ? users.map(u => u.deviceToken).filter((t) => !!t) : []);
        if (tokens.length === 0) {
            logger_1.logger.warn('No valid device tokens for multiple notifications');
            return;
        }
        const multicastMessage = {
            notification: message,
            data,
            tokens,
        };
        try {
            const response = yield admin.messaging().sendEachForMulticast(multicastMessage);
            logger_1.logger.info('Multiple notifications sent successfully', {
                successCount: response.successCount,
                failureCount: response.failureCount,
            });
            // Remove invalid tokens
            const invalidTokens = [];
            response.responses.forEach((resp, idx) => {
                var _a;
                if (!resp.success) {
                    const errorCode = (_a = resp.error) === null || _a === void 0 ? void 0 : _a.code;
                    if (errorCode === 'messaging/registration-token-not-registered' ||
                        errorCode === 'messaging/invalid-argument') {
                        invalidTokens.push(tokens[idx]);
                    }
                }
            });
            if (invalidTokens.length > 0) {
                logger_1.logger.info('Removing invalid tokens', invalidTokens);
                // TODO: remove from DB
            }
        }
        catch (err) {
            logger_1.logger.error('Error sending multiple push notifications', err);
        }
    }
});
exports.firebaseHelper = {
    sendNotification,
};
