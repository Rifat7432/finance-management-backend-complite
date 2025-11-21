import { model, Schema } from 'mongoose';
import { ISubscription, SubscriptionModel } from './subscription.interface';

const subscriptionSchema = new Schema<ISubscription>(
     {
          userId: { type: Schema.ObjectId, required: true, ref: 'User' },
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
     },
     { timestamps: true },
);

export const Subscription = model<ISubscription, SubscriptionModel>('Subscription', subscriptionSchema);
