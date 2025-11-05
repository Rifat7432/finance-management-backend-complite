import { Schema, model } from 'mongoose';
import { IDebt } from './debt.interface';

const debtSchema = new Schema<IDebt>(
     {
          name: { type: String, required: true },
          amount: { type: Number, required: true },
          monthlyPayment: { type: Number, required: true },
          AdHocPayment: { type: Number, required: true },
          capitalRepayment: { type: Number, required: true },
          interestRepayment: { type: Number, required: true },
          payDueDate: { type: String, required: true },
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          isDeleted: { type: Boolean, default: false },
     },
     { timestamps: true },
);

export const Debt = model<IDebt>('Debt', debtSchema);
