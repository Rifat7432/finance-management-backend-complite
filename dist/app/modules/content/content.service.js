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
exports.ContentService = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const content_model_1 = require("./content.model");
const notificationSettings_model_1 = require("../notificationSettings/notificationSettings.model");
const notification_model_1 = require("../notification/notification.model");
const firebaseHelper_1 = require("../../../helpers/firebaseHelper");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const uploadFileToSpaces_1 = require("../../middleware/uploadFileToSpaces");
const createContentToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const newContent = yield content_model_1.Content.create(payload);
    if (!newContent) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create content');
    }
    // Find all users with contentNotification enabled
    const settings = yield notificationSettings_model_1.NotificationSettings.find({ contentNotification: true });
    if (settings && settings.length > 0) {
        yield Promise.all(settings.map((setting) => __awaiter(void 0, void 0, void 0, function* () {
            const notificationPromises = [];
            if (setting.deviceTokenList && setting.deviceTokenList.length > 0) {
                // Send push notification
                notificationPromises.push(yield firebaseHelper_1.firebaseHelper.sendNotification([{ id: String(setting.userId), deviceToken: setting.deviceTokenList[0] }], {
                    title: 'New Content Available',
                    body: newContent.title,
                }, setting.deviceTokenList, 'multiple', { contentId: String(newContent._id) }));
            }
            // Store notification in DB
            notificationPromises.push(notification_model_1.Notification.create({
                title: 'New Content Available',
                message: newContent.title,
                receiver: setting.userId,
                type: 'ADMIN',
                read: false,
            }));
            yield Promise.all(notificationPromises);
        })));
    }
    return newContent;
});
const getContentsFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const contents = new QueryBuilder_1.default(content_model_1.Content.find(), Object.assign(Object.assign({}, query), { isDeleted: false })).filter().sort().paginate().fields();
    const result = yield contents.modelQuery;
    const meta = yield contents.countTotal();
    return { meta, result };
});
const getSingleContentFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const content = yield content_model_1.Content.findById(id);
    if (!content || content.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Content not found or deleted');
    }
    return content;
});
const updateContentToDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const content = yield content_model_1.Content.findById(id);
    if (!content || content.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Content not found or deleted');
    }
    //unlink file here
    if (payload.videoUrl) {
        (0, uploadFileToSpaces_1.deleteFileFromSpaces)(content.videoUrl);
    }
    const updated = yield content_model_1.Content.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update content');
    }
    return updated;
});
const deleteContentFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const content = yield content_model_1.Content.findById(id);
    if (!content || content.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Content not found or deleted');
    }
    const deleted = yield content_model_1.Content.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!deleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Content not found');
    }
    if (content.videoUrl) {
        (0, uploadFileToSpaces_1.deleteFileFromSpaces)(content.videoUrl);
    }
    return true;
});
exports.ContentService = {
    createContentToDB,
    getContentsFromDB,
    getSingleContentFromDB,
    updateContentToDB,
    deleteContentFromDB,
};
