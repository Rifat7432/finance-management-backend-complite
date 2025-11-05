import { model, Schema } from 'mongoose';
import { IIncome } from './income.interface';

const incomeSchema = new Schema<IIncome>(
     {
          name: { type: String, required: true },
          amount: { type: Number, required: true },
          receiveDate: { type: Date, required: true }, // consider Date if storing real date
          frequency: { type: String, enum: ['on-off', 'monthly', 'yearly'], default: 'on-off' }, // e.g., 'once', 'weekly', 'monthly'
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          isDeleted: { type: Boolean, default: false },
     },
     { timestamps: true },
);

// Export model
export const Income = model<IIncome>('Income', incomeSchema);
