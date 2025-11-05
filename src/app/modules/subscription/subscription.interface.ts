import mongoose, { Model } from "mongoose";

export interface ISubscription {
  userId: mongoose.Types.ObjectId;
  subscriptionId: string;
  productId: string;
  purchaseToken: string;
  status: 'active' | 'inactive' | 'expired' | 'canceled';
  expiryDate?: Date;
  lastVerified?: Date;
}


export type SubscriptionModel = Model<ISubscription, Record<string, unknown>>;
