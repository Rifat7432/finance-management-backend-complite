import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middleware/validateRequest';
import { SubscriptionValidation } from './subscription.validation';
import { SubscriptionController } from './subscription.controller';

const router = express.Router();

// 🟢 Create subscription
router.post('/', auth(USER_ROLES.USER), validateRequest(SubscriptionValidation.createSubscriptionZodSchema), SubscriptionController.createSubscription);

// 🔵 Webhook (RevenueCat server only)
router.post('/webhook', SubscriptionController.handleWebhook);

// 🟠 Manual verify
router.get('/verify', auth(USER_ROLES.USER), SubscriptionController.verifySubscription);
// 🟠 Manual verify
router.post('/cancel/:subscriptionId', auth(USER_ROLES.USER), SubscriptionController.cancelSubscription);



export const SubscriptionRoutes = router;
