import mongoose, { Schema } from 'mongoose';
import { IContent } from './content.interface';

const ContentSchema: Schema<IContent> = new Schema(
     {
          title: {
               type: String,
               required: true,
               trim: true,
          },
          category: {
               type: String,
               required: true,
               trim: true,
          },
          duration: {
               type: String,
               trim: true,
          },
          videoUrl: {
               type: String,
               required: true,
          },
          views: {
               type: Number,
               default: 0,
          },
          isDeleted: { type: Boolean, default: false },
     },
     { timestamps: true },
);

export const Content = mongoose.model<IContent>('Content', ContentSchema);
