import { Schema, model } from 'mongoose';
import { IBudget } from './budget.interface';

const budgetSchema = new Schema<IBudget>(
     {
          name: { type: String, required: true },
          amount: { type: Number, required: true },
          type: { type: String, enum: ['personal', 'household'], required: true },
          frequency: { type: String, enum: ['on-off','monthly',], default: 'monthly' }, 
          category: { type: String, required: true },
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          expensesId: { type: Schema.Types.ObjectId, ref: 'Expense'},
          isDeleted: { type: Boolean, default: false },
     },
     { timestamps: true },
);

export const Budget = model<IBudget>('Budget', budgetSchema);
