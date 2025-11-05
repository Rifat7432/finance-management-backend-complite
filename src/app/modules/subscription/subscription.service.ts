import { StatusCodes } from 'http-status-codes';
import config from '../../../config';
import AppError from '../../../errors/AppError';
import { ISubscription } from './subscription.interface';
import { Subscription } from './subscription.model';
import { User } from '../user/user.model';
import { emailTemplate } from '../../../shared/emailTemplate';
import { emailHelper } from '../../../helpers/emailHelper';


// 🔍 Verify subscription with RevenueCat API (optional)
const verifyWithRevenueCat = async (appUserId: string) => {
     const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${appUserId}`, {
          headers: {
               'Authorization': `Bearer ${config.revenuecat_secret_key}`,
               'Content-Type': 'application/json',
          },
     });

     if (!res.ok) throw new AppError(StatusCodes.BAD_REQUEST, 'RevenueCat verification failed');
     return res.json();
};

// 🟢 Create subscription (initial data from app)
const createSubscriptionToDB = async (userId: string, payload: Partial<ISubscription>): Promise<ISubscription> => {
     const revenueCatData = await verifyWithRevenueCat(payload.subscriptionId!);
     const isUserSubscribed = await Subscription.findOne({ userId });
     if (isUserSubscribed) throw new AppError(StatusCodes.BAD_REQUEST, 'User already has a subscription');

     const subscription = await Subscription.create({
          ...payload,
          userId,
          status: payload.status || 'active',
          lastVerified: new Date(),
     });
     await User.findByIdAndUpdate(userId, { subscriptionId: payload.subscriptionId });
     if (!subscription) throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create subscription');
     return subscription;
};

// 🔵 Handle RevenueCat webhook
export const handleWebhookEventToDB = async (webhookData: any) => {
     try {
          const { event, app_user_id, product_id, purchase_token, event_type, expiration_at_ms, period_type } = webhookData;

          // Map RevenueCat event type → local subscription status
          const mappedStatus =
               event_type === 'CANCELLATION'
                    ? 'canceled'
                    : event_type === 'RENEWAL'
                      ? 'renewal'
                      : event_type === 'EXPIRATION'
                        ? 'failed'
                        : event_type === 'SUBSCRIBER_ALIAS'
                          ? 'phase_changed'
                          : 'active';

          const updateData = {
               status: mappedStatus,
               productId: product_id,
               purchaseToken: purchase_token,
               expiryDate: expiration_at_ms ? new Date(expiration_at_ms) : undefined,
               lastVerified: new Date(),
          };

          // Update or insert subscription
          const subscription = await Subscription.findOneAndUpdate({ subscriptionId: app_user_id }, { $set: updateData }, { new: true, upsert: true });

          console.log(`✅ RevenueCat webhook processed: ${event_type} for ${app_user_id}`);

          // 🔔 Notify user by email
          const user = await User.findById(subscription.userId);
          if (user?.email) {
               const emailData = emailTemplate.subscriptionEvent({
                    email: user.email,
                    name: user.name || 'User',
                    status: mappedStatus as any,
                    planName: subscription.productId || 'Your Plan',
                    nextBillingDate: subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : undefined,
               });

               await emailHelper.sendEmail(emailData); // 📨 Use your helper (Nodemailer, Postmark, etc.)
               console.log(`📧 Subscription email sent to ${user.email} (${mappedStatus})`);
          }
     } catch (error) {
          console.error('❌ RevenueCat webhook failed:', error);
     }
};

// 🟠 Manual verification (optional)
const verifySubscriptionToDB = async (userId: string): Promise<ISubscription> => {
     const subscription = await Subscription.findOne({ userId });
     if (!subscription) throw new AppError(StatusCodes.NOT_FOUND, 'Subscription not found');

     const adaptyData = await verifyWithRevenueCat(subscription.subscriptionId);
     const updated = await Subscription.findByIdAndUpdate(
          subscription._id,
          {
               status: adaptyData.subscriber.entitlements.active ? 'active' : 'canceled',
               expiryDate: new Date(adaptyData.subscriber.expiration_date),
               lastVerified: new Date(),
          },
          { new: true },
     );

     if (!updated) throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to verify subscription');
     return updated;
};

/**
 * 🚫 Cancel a user's subscription in RevenueCat
 */
const cancelSubscriptionIntoDB = async (appUserId: string) => {
     // 1️⃣ Find the user's active subscription in your DB
     const subscription = await Subscription.findOne({ subscriptionId: appUserId });
     if (!subscription) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Subscription not found');
     }

     // 2️⃣ Call RevenueCat API to revoke / cancel
     const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${appUserId}/subscriptions/${subscription.productId}`, {
          method: 'DELETE',
          headers: {
               'Authorization': `Bearer ${config.revenuecat_secret_key}`,
               'Content-Type': 'application/json',
          },
     });

     if (!res.ok) {
          console.error('RevenueCat cancel failed:', await res.text());
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to cancel subscription in RevenueCat');
     }

     // 3️⃣ Update local DB
     subscription.status = 'canceled';
     subscription.lastVerified = new Date();
     await subscription.save();

     // 4️⃣ Notify the user by email
     const user = await User.findByIdAndUpdate(subscription.userId, { subscriptionId: '' });
     if (user?.email) {
          const emailData = emailTemplate.subscriptionEvent({
               email: user.email,
               name: user.name || 'User',
               status: 'canceled',
               planName: subscription.productId || 'Your Plan',
               nextBillingDate: subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : undefined,
          });

          await emailHelper.sendEmail(emailData);
          console.log(`📧 Cancellation email sent to ${user.email}`);
     }
     return {
          success: true,
          message: `Subscription canceled successfully for ${appUserId}`,
     };
};



export const SubscriptionService = {
     createSubscriptionToDB,
     handleWebhookEventToDB,
     verifySubscriptionToDB,
     cancelSubscriptionIntoDB
};
