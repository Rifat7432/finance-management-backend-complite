"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSettingsRouter = void 0;
const express_1 = __importDefault(require("express"));
const notificationSettings_controller_1 = require("./notificationSettings.controller");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const notificationSettings_validation_1 = require("./notificationSettings.validation");
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middleware/auth"));
const router = express_1.default.Router();
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.USER), notificationSettings_controller_1.NotificationSettingsController.getNotificationSettings);
router.patch('/', (0, auth_1.default)(user_1.USER_ROLES.USER), (0, validateRequest_1.default)(notificationSettings_validation_1.NotificationSettingsValidation.updateNotificationSettingsZodSchema), notificationSettings_controller_1.NotificationSettingsController.updateNotificationSettings);
exports.NotificationSettingsRouter = router;
