import { Schema, model } from 'mongoose';
import { IAd } from './ad.interface';

const adSchema = new Schema<IAd>(
     {
          name: { type: String, required: true },
          startDate: { type: Date, required: true },
          endDate: { type: Date, required: true },
             category: {
               type: String,
               required: true,
               trim: true,
          },
          url: {
               type: String,
               required: true,
          },
          isDeleted: { type: Boolean, default: false },
     },
     { timestamps: true },
);

export const Ad = model<IAd>('Ad', adSchema);
