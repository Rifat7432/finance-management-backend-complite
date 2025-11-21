import { Schema, model } from 'mongoose';
import { IPartnerRequest } from './partnerRequest.interface';

const partnerRequestSchema = new Schema<IPartnerRequest>(
     {
          fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Who sent the request
          toUser: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // Registered user (if exists)
          name: { type: String }, // Name for non-registered user
          email: { type: String, required: true }, // Email for non-registered user
          relation: { type: String, default: '' },
          status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
     },
     { timestamps: true },
);

export const PartnerRequest = model('PartnerRequest', partnerRequestSchema);
