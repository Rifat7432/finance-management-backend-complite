import { StatusCodes } from 'http-status-codes';
import config from '../../../config';
import AppError from '../../../errors/AppError';
import { ISubscription } from './subscription.interface';
import { Subscription } from './subscription.model';
import { emailTemplate } from '../../../shared/emailTemplate';
import { emailHelper } from '../../../helpers/emailHelper';
import { errorLogger, logger } from '../../../shared/logger';
import { User } from '../user/user.model';
// ✅ Winston logger

/**
 * 🔍 Verify subscription with RevenueCat API
 */
const verifyWithRevenueCat = async (appUserId: string) => {
     try {
          const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${appUserId}`, {
               headers: {
                    'Authorization': `Bearer ${config.revenuecat_secret_key}`,
                    'Content-Type': 'application/json',
               },
          });

          if (!res.ok) {
               const errorText = await res.text();
               logger.error(`RevenueCat verification failed: ${errorText}`);
               throw new AppError(StatusCodes.BAD_REQUEST, 'RevenueCat verification failed');
          }

          logger.info(`RevenueCat verification successful for ${appUserId}`);
          return res.json();
     } catch (error) {
          errorLogger.error('RevenueCat verification error', error);
          throw error;
     }
};

/**
 * 🟢 Create subscription
 */
const createSubscriptionToDB = async (userId: string, payload: Partial<ISubscription>): Promise<ISubscription> => {
     if (!payload.subscriptionId) {
          errorLogger.warn('Subscription creation failed: subscriptionId missing');
          throw new AppError(StatusCodes.BAD_REQUEST, 'subscriptionId required');
     }

     const revenueCatData = await verifyWithRevenueCat(payload.subscriptionId);

     const isUserSubscribed = await Subscription.findOne({ userId });

     if (isUserSubscribed) {
          errorLogger.warn(`User ${userId} already has a subscription`);
          throw new AppError(StatusCodes.BAD_REQUEST, 'User already has a subscription');
     }

     const activeEntitlements = revenueCatData?.subscriber?.entitlements?.active || {};

     const isActive = Object.keys(activeEntitlements).length > 0;

     if (!isActive) {
          errorLogger.warn(`No active RevenueCat entitlement for ${payload.subscriptionId}`);
          throw new AppError(StatusCodes.BAD_REQUEST, 'No active subscription found in RevenueCat');
     }

     const subscription = await Subscription.create({
          ...payload,
          userId,
          status: 'active',
          lastVerified: new Date(),
     });

     await User.findByIdAndUpdate(userId, {
          $set: { subscriptionId: payload.subscriptionId },
     });

     logger.info(`Subscription created for user ${userId}`);

     if (!subscription) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create subscription');
     }

     return subscription;
};

/**
 * 🔵 Handle RevenueCat Webhook
 */
export const handleWebhookEventToDB = async (webhookData: any) => {
     try {
          const event = webhookData?.event;

          if (!event) {
               errorLogger.warn('Invalid RevenueCat webhook payload');
               return;
          }

          const { type, app_user_id, product_id, transaction_id, expiration_at_ms, original_transaction_id } = event;

          const expiryDate = expiration_at_ms ? new Date(expiration_at_ms) : undefined;

          let status = 'active';

          switch (type) {
               case 'INITIAL_PURCHASE':
                    status = 'active';
                    break;

               case 'RENEWAL':
                    status = 'active';
                    break;

               case 'CANCELLATION':
                    status = 'canceled';
                    break;

               case 'EXPIRATION':
                    status = 'expired';
                    break;

               case 'BILLING_ISSUE':
                    status = 'billing_issue';
                    break;

               case 'PRODUCT_CHANGE':
                    status = 'active';
                    break;

               default:
                    logger.info(`Unhandled RevenueCat event: ${type}`);
                    return;
          }

          /**
           * Find user
           */
          const user = await User.findOne({ email: app_user_id });
          if (!user) {
               errorLogger.warn(`User not found for ${app_user_id}`);
               return;
          }

          /**
           * Create or update subscription
           */
          console.log('any');
          const subscription = await Subscription.findOne({ subscriptionId: app_user_id });
          if (subscription) {
               await Subscription.findOneAndUpdate(
                    { userId: user._id },
                    {
                         userId: user._id,
                         subscriptionId: app_user_id,
                         productId: product_id,
                         purchaseToken: transaction_id,
                         expiryDate,
                         status,
                         lastVerified: new Date(),
                    },
                    { new: true },
               );
          } else {
               await Subscription.create({
                    userId: user._id,
                    subscriptionId: app_user_id,
                    productId: product_id,
                    purchaseToken: transaction_id,
                    expiryDate,
                    status,
                    lastVerified: new Date(),
               });
          }

          /**
           * Update user subscription reference
           */

          if (status === 'expired' || status === 'canceled') {
               await User.findByIdAndUpdate(user._id, {
                    subscriptionId: '',
               });
          } else {
               await User.findByIdAndUpdate(
                    user._id,
                    {
                         subscriptionId: app_user_id,
                    },
                    { new: true },
               );
          }

          logger.info(`RevenueCat event processed: ${type} | user: ${user._id}`);
     } catch (error) {
          errorLogger.error('RevenueCat webhook failed', error);
     }
};

/**
 * 🟠 Manual subscription verification
 */
const verifySubscriptionToDB = async (userId: string): Promise<ISubscription> => {
     const subscription = await Subscription.findOne({ userId });

     if (!subscription) {
          logger.warn(`Subscription verification failed: user ${userId}`);
          throw new AppError(StatusCodes.NOT_FOUND, 'Subscription not found');
     }

     const revenueCatData = await verifyWithRevenueCat(subscription.subscriptionId);

     const activeEntitlements = revenueCatData?.subscriber?.entitlements?.active || {};

     const isActive = Object.keys(activeEntitlements).length > 0;

     const expiry = revenueCatData?.subscriber?.subscriptions?.[subscription.productId]?.expires_date;

     const updated = await Subscription.findByIdAndUpdate(
          subscription._id,
          {
               status: isActive ? 'active' : 'canceled',
               expiryDate: expiry ? new Date(expiry) : undefined,
               lastVerified: new Date(),
          },
          { new: true },
     );

     if (!updated) {
          errorLogger.error(`Subscription verification DB update failed for ${userId}`);
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to verify subscription');
     }

     await User.findByIdAndUpdate(userId, {
          subscriptionId: subscription.subscriptionId,
     });

     logger.info(`Subscription verified for user ${userId}`);

     return updated;
};

/**
 * 🚫 Cancel subscription locally
 */
const cancelSubscriptionIntoDB = async (appUserId: string) => {
     const subscription = await Subscription.findOne({
          subscriptionId: appUserId,
     });

     if (!subscription) {
          errorLogger.warn(`Cancel subscription failed: ${appUserId} not found`);
          throw new AppError(StatusCodes.NOT_FOUND, 'Subscription not found');
     }

     subscription.status = 'canceled';
     subscription.lastVerified = new Date();

     await subscription.save();

     const user = await User.findByIdAndUpdate(subscription.userId, {
          subscriptionId: '',
     });

     logger.info(`Subscription canceled locally for ${appUserId}`);

     if (user?.email) {
          const emailData = emailTemplate.subscriptionEvent({
               email: user.email,
               name: user.name || 'User',
               status: 'canceled',
               planName: subscription.productId || 'Your Plan',
               nextBillingDate: subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : undefined,
          });

          await emailHelper.sendEmail(emailData);

          logger.info(`Cancellation email sent to ${user.email}`);
     }

     return {
          success: true,
          message: `Subscription canceled locally for ${appUserId}`,
     };
};

export const SubscriptionService = {
     createSubscriptionToDB,
     handleWebhookEventToDB,
     verifySubscriptionToDB,
     cancelSubscriptionIntoDB,
};
