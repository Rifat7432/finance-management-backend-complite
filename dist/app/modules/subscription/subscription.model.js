"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const mongoose_1 = require("mongoose");
const subscriptionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.ObjectId, required: true, ref: 'User' },
    subscriptionId: { type: String, required: true, unique: true },
    productId: { type: String, required: true },
    purchaseToken: { type: String, required: true },
    status: {
        type: String,
        enum: ['active', 'inactive', 'expired', 'canceled'],
        default: 'inactive',
    },
    expiryDate: { type: Date },
    lastVerified: { type: Date },
}, { timestamps: true });
exports.Subscription = (0, mongoose_1.model)('Subscription', subscriptionSchema);
