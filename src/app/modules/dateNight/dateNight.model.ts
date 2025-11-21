import { Schema, model } from 'mongoose';
import { IDateNight } from './dateNight.interface';

const dateNightSchema = new Schema<IDateNight>(
     {
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          plan: {
               type: String,
               required: true,
               trim: true,
          },
          budget: {
               type: Number,
               required: true,
               min: 0,
          },
          repeatEvery: {
               type: String,
               enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
               default: 'Monthly',
          },
          date: {
               type: Date,
          },
          time: {
               type: String, // could also be Date if storing full datetime
          },
          location: {
               type: String,
               trim: true,
          },
          isDeleted: {
               type: Boolean,
               default: false,
          },
     },
     { timestamps: true },
);

export const DateNight = model<IDateNight>('DateNight', dateNightSchema);
