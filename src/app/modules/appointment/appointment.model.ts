import { Schema, model } from 'mongoose';
import { IAppointment } from './appointment.interface';
import { toUTCWithTime } from '../../../utils/dateTimeHelper';
function getAppointmentUTC(dateStr: string, timeStr: string): Date {
     const [time, modifier] = timeStr.split(' ');
     let [hours, minutes] = time.split(':').map(Number);

     if (modifier === 'PM' && hours !== 12) hours += 12;
     if (modifier === 'AM' && hours === 12) hours = 0;

     const localDateTime = `${dateStr} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

     return toUTCWithTime(localDateTime);
}

const appointmentSchema = new Schema<IAppointment>(
     {
          name: { type: String, required: true },
          email: { type: String, required: true },
          title: { type: String, required: true },
          number: { type: String, required: true },
          bestContact: { type: String, required: true },
          attendant: { type: String, required: true },
          isChild: { type: Boolean, required: true },
          approxIncome: { type: Number, required: true },
          investment: { type: Number, required: true },
          discuss: { type: String },
          reachingFor: { type: String, required: true },
          ask: { type: String, required: true },
          date: { type: String, required: true },
          timeSlot: { type: String, required: true },
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          status: { type: String, enum: ['pending', 'complete'], default: 'pending' },
          UTCDate: {
               type: Date,
               default: new Date(),
          },
          isDeleted: { type: Boolean, default: false },
          isRemainderSent: { type: Boolean, default: false },
     },
     { timestamps: true },
);
appointmentSchema.pre('save', function (next) {
     if (!this.isModified('date') && !this.isModified('time')) {
          return next();
     }
     const timeSlot = this.timeSlot;
     const startTime = timeSlot.split(' - ')[0];
     this.UTCDate = getAppointmentUTC(this.date, startTime);
     next();
});

export const Appointment = model<IAppointment>('Appointment', appointmentSchema);
