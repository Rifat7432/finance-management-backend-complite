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
exports.SubscriptionService = exports.handleWebhookEventToDB = void 0;
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const subscription_model_1 = require("./subscription.model");
const user_model_1 = require("../user/user.model");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const emailHelper_1 = require("../../../helpers/emailHelper");
// 🔍 Verify subscription with RevenueCat API (optional)
const verifyWithRevenueCat = (appUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield fetch(`https://api.revenuecat.com/v1/subscribers/${appUserId}`, {
        headers: {
            'Authorization': `Bearer ${config_1.default.revenuecat_secret_key}`,
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'RevenueCat verification failed');
    return res.json();
});
// 🟢 Create subscription (initial data from app)
const createSubscriptionToDB = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const revenueCatData = yield verifyWithRevenueCat(payload.subscriptionId);
    const isUserSubscribed = yield subscription_model_1.Subscription.findOne({ userId });
    if (isUserSubscribed)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User already has a subscription');
    const subscription = yield subscription_model_1.Subscription.create(Object.assign(Object.assign({}, payload), { userId, status: payload.status || 'active', lastVerified: new Date() }));
    yield user_model_1.User.findByIdAndUpdate(userId, {
        $set: { subscriptionId: payload.subscriptionId },
    });
    if (!subscription)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create subscription');
    return subscription;
});
// 🔵 Handle RevenueCat webhook
const handleWebhookEventToDB = (webhookData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { event, app_user_id, product_id, purchase_token, event_type, expiration_at_ms, period_type } = webhookData;
        // Map RevenueCat event type → local subscription status
        const mappedStatus = event_type === 'CANCELLATION'
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
        const subscription = yield subscription_model_1.Subscription.findOneAndUpdate({ subscriptionId: app_user_id }, { $set: updateData }, { new: true, upsert: true });
        if (subscription && ['failed', 'canceled'].includes(mappedStatus)) {
            yield user_model_1.User.findByIdAndUpdate(subscription.userId, {
                $set: { subscriptionId: '' },
            });
        }
        console.log(`✅ RevenueCat webhook processed: ${event_type} for ${app_user_id}`);
        // 🔔 Notify user by email
        const user = yield user_model_1.User.findById(subscription.userId);
        if (user === null || user === void 0 ? void 0 : user.email) {
            const emailData = emailTemplate_1.emailTemplate.subscriptionEvent({
                email: user.email,
                name: user.name || 'User',
                status: mappedStatus,
                planName: subscription.productId || 'Your Plan',
                nextBillingDate: subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : undefined,
            });
            yield emailHelper_1.emailHelper.sendEmail(emailData); // 📨 Use your helper (Nodemailer, Postmark, etc.)
            console.log(`📧 Subscription email sent to ${user.email} (${mappedStatus})`);
        }
    }
    catch (error) {
        console.error('❌ RevenueCat webhook failed:', error);
    }
});
exports.handleWebhookEventToDB = handleWebhookEventToDB;
// 🟠 Manual verification (optional)
const verifySubscriptionToDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const subscription = yield subscription_model_1.Subscription.findOne({ userId });
    if (!subscription)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Subscription not found');
    const adaptyData = yield verifyWithRevenueCat(subscription.subscriptionId);
    const updated = yield subscription_model_1.Subscription.findByIdAndUpdate(subscription._id, {
        status: adaptyData.subscriber.entitlements.active ? 'active' : 'canceled',
        expiryDate: new Date(adaptyData.subscriber.expiration_date),
        lastVerified: new Date(),
    }, { new: true });
    yield user_model_1.User.findByIdAndUpdate(userId, { subscriptionId: subscription.subscriptionId });
    if (!updated)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to verify subscription');
    return updated;
});
/**
 * 🚫 Cancel a user's subscription in RevenueCat
 */
const cancelSubscriptionIntoDB = (appUserId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Find the user's active subscription in your DB
    const subscription = yield subscription_model_1.Subscription.findOne({ subscriptionId: appUserId });
    if (!subscription) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Subscription not found');
    }
    // 2️⃣ Call RevenueCat API to revoke / cancel
    const res = yield fetch(`https://api.revenuecat.com/v1/subscribers/${appUserId}/subscriptions/${subscription.productId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${config_1.default.revenuecat_secret_key}`,
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) {
        console.error('RevenueCat cancel failed:', yield res.text());
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to cancel subscription in RevenueCat');
    }
    // 3️⃣ Update local DB
    subscription.status = 'canceled';
    subscription.lastVerified = new Date();
    yield subscription.save();
    // 4️⃣ Notify the user by email
    const user = yield user_model_1.User.findByIdAndUpdate(subscription.userId, { subscriptionId: '' });
    if (user === null || user === void 0 ? void 0 : user.email) {
        const emailData = emailTemplate_1.emailTemplate.subscriptionEvent({
            email: user.email,
            name: user.name || 'User',
            status: 'canceled',
            planName: subscription.productId || 'Your Plan',
            nextBillingDate: subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : undefined,
        });
        yield emailHelper_1.emailHelper.sendEmail(emailData);
        console.log(`📧 Cancellation email sent to ${user.email}`);
    }
    return {
        success: true,
        message: `Subscription canceled successfully for ${appUserId}`,
    };
});
exports.SubscriptionService = {
    createSubscriptionToDB,
    handleWebhookEventToDB: exports.handleWebhookEventToDB,
    verifySubscriptionToDB,
    cancelSubscriptionIntoDB,
};
