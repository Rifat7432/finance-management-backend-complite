import { Schema, model } from 'mongoose';
import { IDateNight } from './dateNight.interface';
import { toUTCWithTime } from '../../../utils/dateTimeHelper';
function getAppointmentUTC(dateStr: string, timeStr: string): Date {
     const [time, modifier] = timeStr.split(' ');
     let [hours, minutes] = time.split(':').map(Number);

     if (modifier === 'PM' && hours !== 12) hours += 12;
     if (modifier === 'AM' && hours === 12) hours = 0;

     const localDateTime = `${dateStr} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

     return toUTCWithTime(localDateTime);
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
               enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly','One-Off'],
               default: 'Monthly',
          },
          date: {
               type: String,
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
     // console.log('this', getAppointmentUTC(this.date as Date, this.time as string, 'Europe/London'), this.time, this.date);
     this.UTCDate = getAppointmentUTC(this.date!, this.time!);

     next();
});
export const DateNight = model<IDateNight>('DateNight', dateNightSchema);
