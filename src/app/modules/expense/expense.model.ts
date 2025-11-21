import { Schema, model } from 'mongoose';
import { IExpense } from './expense.interface';



// Schema
const expenseSchema = new Schema<IExpense>(
     {
          name: { type: String, required: true },
          amount: { type: Number, required: true },
          endDate: { type: Date, required: true }, // consider Date type
          frequency: { type: String, enum: ['on-off', 'weekly', 'monthly', 'yearly'], default: 'on-off' }, // optional: enum like 'daily', 'monthly'
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          isDeleted: { type: Boolean, default: false },
     },
     { timestamps: true },
);

// Model
export const Expense = model<IExpense>('Expense', expenseSchema);
