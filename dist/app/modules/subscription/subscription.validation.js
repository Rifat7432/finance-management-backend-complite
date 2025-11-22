"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionValidation = void 0;
const zod_1 = require("zod");
exports.SubscriptionValidation = {
    createSubscriptionZodSchema: zod_1.z.object({
        body: zod_1.z.object({
            subscriptionId: zod_1.z.string().nonempty('Subscription ID is required'),
            productId: zod_1.z.string().nonempty('Product ID is required'),
            purchaseToken: zod_1.z.string().nonempty('Purchase token is required'),
        }),
    }),
};
