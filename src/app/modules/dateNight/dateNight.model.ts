import { Schema, model } from 'mongoose';
import { IDateNight } from './dateNight.interface';
function getAppointmentUTC(dateStr: Date, timeStr: string, timeZone: string): Date {
     // Normalize timeStr
     timeStr = timeStr.replace(/\u202F/g, ' ').trim();
     const [time, modifier] = timeStr.split(' ');
     if (!time || !modifier) throw new Error('Invalid time string');

     let [hours, minutes] = time.split(':').map(Number);
     if (modifier === 'PM' && hours !== 12) hours += 12;
     if (modifier === 'AM' && hours === 12) hours = 0;

     // Parse date
     const date = new Date(dateStr);

     if (isNaN(date.getTime())) {
          throw new Error('Invalid date string');
     }

     // Get the UTC timestamp for this date in the target timezone
     const parts = date.toLocaleString('en-US', { timeZone }).split(',')[0].split('/');
     const [month, day, year] = parts.map(Number);

     // Build the Date object in UTC
     const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));

     return utcDate;
}

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
               required: true,
          },
          time: {
               type: String, // could also be Date if storing full datetime
               required: true,
          },
          location: {
               type: String,
               trim: true,
          },
          UTCDate: {
               type: Date,
               default: new Date(),
          },
          isRemainderSent: {
               type: Boolean,
               default: false,
          },
          isDeleted: {
               type: Boolean,
               default: false,
          },
     },
     { timestamps: true },
);
dateNightSchema.pre('save', function (next) {
     if (!this.isModified('date') && !this.isModified('time')) {
          return next();
     }
     console.log('this', getAppointmentUTC(this.date as Date, this.time as string, 'Europe/London'), this.time, this.date);
     this.UTCDate = getAppointmentUTC(this.date as Date, this.time as string, 'Europe/London');

     next();
});
export const DateNight = model<IDateNight>('DateNight', dateNightSchema);
