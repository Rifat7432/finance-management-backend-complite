import mongoose, { Document } from 'mongoose';

export interface IContent extends Document {
     title: string;
     category: string;
     duration: string;
     videoUrl: string;
     views: number;
     isDeleted: boolean;
}
