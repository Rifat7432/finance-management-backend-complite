import { Document, Types } from 'mongoose';

export interface IBudget extends Document {
     name: string;
     amount: number;
     type: 'personal' | 'household';
     category: string;
     userId: Types.ObjectId;
     isDeleted: boolean;
}
export type BudgetWithCreatedAt = {
     amount: number;
     createdAt: Date;
};
