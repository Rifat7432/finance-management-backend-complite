"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const admin_controller_1 = require("./admin.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const notificationSettings_validation_1 = require("../notificationSettings/notificationSettings.validation");
const router = express_1.default.Router();
//user admin routes
router.get('/users/finance-track', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), admin_controller_1.AdminController.getUserFinancialOverview);
router.get('/user/expenses-details/:userId', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), admin_controller_1.AdminController.getMonthlyExpenseAnalytics);
//appointment admin routes
router.patch('/appointments/:userId', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), admin_controller_1.AdminController.updateAppointmentStatus);
//notification settings admin routes
router.get('/notification-settings/:userId', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), admin_controller_1.AdminController.getNotificationSettings);
router.patch('/notification-settings/:userId', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(notificationSettings_validation_1.NotificationSettingsValidation.updateNotificationSettingsZodSchema), admin_controller_1.AdminController.updateNotificationSettings);
router.get('/stats', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), admin_controller_1.AdminController.getAdminRevenue);
exports.AdminRoutes = router;
