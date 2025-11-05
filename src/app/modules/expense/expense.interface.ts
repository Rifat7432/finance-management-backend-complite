import { Document, Types } from 'mongoose';
// Interface
export interface IExpense extends Document {
     name: string;
     amount: number;
     endDate: Date; // Or Date, if you want real date type
     frequency: 'on-off' | 'weekly' | 'monthly' | 'yearly'; // Adjust as needed
     userId: Types.ObjectId;
     isDeleted: boolean;
}
