import { Document, Types } from 'mongoose';

export interface IBudget extends Document {
     name: string;
     amount: number;
     type: 'personal' | 'household';
     frequency: 'on-off' | 'monthly';
     category: string;
     userId: Types.ObjectId;
     isDeleted: boolean;
     createdAt: Date;
}
export type BudgetWithCreatedAt = {
     amount: number;
     createdAt: Date;
};
