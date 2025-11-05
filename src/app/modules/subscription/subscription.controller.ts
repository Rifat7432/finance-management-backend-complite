import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SubscriptionService } from './subscription.service';

// 🟢 Create subscription
const createSubscription = catchAsync(async (req, res) => {
     const user = req.user;
     const result = await SubscriptionService.createSubscriptionToDB(user.id, req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.CREATED,
          message: 'Subscription created successfully',
          data: result,
     });
});

// 🔵 RevenueCat webhook
const handleWebhook = catchAsync(async (req, res) => {
     await SubscriptionService.handleWebhookEventToDB(req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Webhook processed successfully',
     });
});

// 🟠 Manual verify (optional)
const verifySubscription = catchAsync(async (req, res) => {
     const { userId } = req.user.id;
     const result = await SubscriptionService.verifySubscriptionToDB(userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Subscription verified successfully',
          data: result,
     });
});
const cancelSubscription = catchAsync(async (req, res) => {
     const result = await SubscriptionService.cancelSubscriptionIntoDB(req.params.subscriptionId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Subscription canceled successfully',
          data: result,
     });
});


export const SubscriptionController = {
     createSubscription,
     handleWebhook,
     verifySubscription,
     cancelSubscription
};
