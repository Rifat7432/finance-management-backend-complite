import { Document, Types } from 'mongoose';

export interface IDateNight extends Document {
     userId: Types.ObjectId;
     plan: string;
     budget: number;
     repeatEvery: 'One-Off' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
     date?: Date;
     time?: string;
     location?: string;
     UTCDate: Date;
     isDeleted: boolean;
     isRemainderSent: boolean;
}
