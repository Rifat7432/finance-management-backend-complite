import { Schema, model } from 'mongoose';
import { IAppointment } from './appointment.interface';
function getAppointmentUTC(dateStr: string, timeStr: string, timeZone: string): Date {
     // Parse the base date (already UTC in your case)
     const date = new Date(dateStr);

     // Parse time string like "02:56 AM"
     const [time, modifier] = timeStr.split(' ');
     let [hours, minutes] = time.split(':').map(Number);

     // Convert 12-hour → 24-hour
     if (modifier === 'PM' && hours !== 12) hours += 12;
     if (modifier === 'AM' && hours === 12) hours = 0;

     // Format the date into the target timezone (YYYY-MM-DD)
     const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
     });

     const parts = formatter.formatToParts(date);

     const y = parts.find((p) => p.type === 'year')?.value!;
     const m = parts.find((p) => p.type === 'month')?.value!;
     const d = parts.find((p) => p.type === 'day')?.value!;

     // Build ISO-like datetime in that timezone
     const localISO = `${y}-${m}-${d}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

     // Convert that timezone datetime into UTC
     const utcDate = new Date(localISO + 'Z');

     return utcDate;
}
const appointmentSchema = new Schema<IAppointment>(
     {
          name: { type: String, required: true },
          email: { type: String, required: true },
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
          isRemainderSent: { type: Boolean, default: false },
     },
     { timestamps: true },
);
appointmentSchema.pre('save', function (next) {
     if (!this.isModified('date') && !this.isModified('time')) {
          return next();
     }
     this.UTCDate = getAppointmentUTC(this.date, this.timeSlot, 'Europe/London');
     next();
});

export const Appointment = model<IAppointment>('Appointment', appointmentSchema);
