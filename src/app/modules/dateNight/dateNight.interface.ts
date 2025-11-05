import { Document, Types } from 'mongoose';

export interface IDateNight extends Document {
     userId: Types.ObjectId;
     plan: string;
     budget: number;
     repeatEvery: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
     date?: Date;
     time?: string;
     location?: string;
     isDeleted:boolean
}
