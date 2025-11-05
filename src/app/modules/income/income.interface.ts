import { Document, Types } from 'mongoose';

// Interface for Income document
export interface IIncome extends Document {
     name: string;
     amount: number;
     receiveDate: Date; // changed from 'reaciveDate'
     frequency: 'yearly' | 'monthly' | 'on-off'; // added frequency options
     userId: Types.ObjectId;
     isDeleted: boolean;
}
