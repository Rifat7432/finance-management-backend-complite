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
          completionRatio: { type: Number, default: 0 }
     },
     { timestamps: true },
);
debtSchema.pre('findOneAndUpdate', async function (next) {
     const update = this.getUpdate() as any;

     // fetch existing document
     const doc = await this.model.findOne(this.getQuery());

     if (!doc) return next();

     const capitalRepayment = update.capitalRepayment ?? doc.capitalRepayment;
     const interestRepayment = update.interestRepayment ?? doc.interestRepayment;
     const AdHocPayment = update.AdHocPayment ?? doc.AdHocPayment;
     const amount = update.amount ?? doc.amount;

     const totalPaid =
          capitalRepayment +
          interestRepayment +
          AdHocPayment;

     update.completionRatio = Math.min((totalPaid / amount) * 100, 100);

     next();
});

export const Debt = model<IDebt>('Debt', debtSchema);
