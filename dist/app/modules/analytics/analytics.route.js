"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsRouter = void 0;
const express_1 = __importDefault(require("express"));
const analytics_controller_1 = require("./analytics.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enums/user");
const router = express_1.default.Router();
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.USER), analytics_controller_1.AnalyticsController.getAnalytics);
router.get('/user-last-update', (0, auth_1.default)(user_1.USER_ROLES.USER), analytics_controller_1.AnalyticsController.getLatestUpdate);
exports.AnalyticsRouter = router;
