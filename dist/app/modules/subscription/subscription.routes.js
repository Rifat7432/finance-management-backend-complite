"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enums/user");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const subscription_validation_1 = require("./subscription.validation");
const subscription_controller_1 = require("./subscription.controller");
const router = express_1.default.Router();
// 🟢 Create subscription
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.USER), (0, validateRequest_1.default)(subscription_validation_1.SubscriptionValidation.createSubscriptionZodSchema), subscription_controller_1.SubscriptionController.createSubscription);
// 🔵 Webhook (RevenueCat server only)
router.post('/webhook', subscription_controller_1.SubscriptionController.handleWebhook);
// 🟠 Manual verify
router.get('/verify', (0, auth_1.default)(user_1.USER_ROLES.USER), subscription_controller_1.SubscriptionController.verifySubscription);
// 🟠 Manual verify
router.post('/cancel/:subscriptionId', (0, auth_1.default)(user_1.USER_ROLES.USER), subscription_controller_1.SubscriptionController.cancelSubscription);
exports.SubscriptionRoutes = router;
