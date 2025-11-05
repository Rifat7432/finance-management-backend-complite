import { StatusCodes } from 'http-status-codes';
import { Appointment } from './appointment.model';
import AppError from '../../../errors/AppError';
import { IAppointment } from './appointment.interface';
import { NotificationSettings } from '../notificationSettings/notificationSettings.model';
import { Notification } from '../notification/notification.model';
import { firebaseHelper } from '../../../helpers/firebaseHelper';
import QueryBuilder from '../../builder/QueryBuilder';

const createAppointmentToDB = async (data: Partial<IAppointment>, userId: string): Promise<IAppointment | null> => {
     const { date, timeSlot, ...rest } = data;
     if (!date || !timeSlot) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Date and timeSlot are required');
     }

     // Example input: "10:00 AM - 11:00 AM"
     const [startTimeRaw, endTimeRaw] = timeSlot.split(' - ').map((time) => time.trim());

     // Convert "10:00 AM" to "10:00" (24-hour format) for validation
     const to24Hour = (timeStr: string) => {
          const dateObj = new Date(`1970-01-01T${timeStr}`);
          if (!isNaN(dateObj.getTime())) {
               return dateObj.toTimeString().slice(0, 8);
          }
          // Try parsing with AM/PM
          const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
          if (match) {
               let hour = parseInt(match[1], 10);
               const minute = match[2];
               const ampm = match[3].toUpperCase();
               if (ampm === 'PM' && hour < 12) hour += 12;
               if (ampm === 'AM' && hour === 12) hour = 0;
               return `${hour.toString().padStart(2, '0')}:${minute}:00`;
          }
          return null;
     };

     const startTime = to24Hour(startTimeRaw);
     const endTime = to24Hour(endTimeRaw);

     if (!startTime || !endTime) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid time format (expected HH:mm or HH:mm:ss or HH:mm AM/PM)');
     }

     // Validate date
     const parsedDate = new Date(date);
     if (isNaN(parsedDate.getTime())) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid date format');
     }

     // Check if an appointment already exists for the given date and timeSlot
     const existingAppointment = await Appointment.findOne({ date, timeSlot });
     if (existingAppointment) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Time slot already booked');
     }

     // Create the appointment
     const appointment = await Appointment.create({
          ...data,
          userId,
     });

     // Send notification only to the user who booked the appointment, if their settings allow
     const userSetting = await NotificationSettings.findOne({ userId });
     if (userSetting?.appointmentNotification) {
          if (userSetting.deviceTokenList && userSetting.deviceTokenList.length > 0) {
               await firebaseHelper.sendNotification(
                    [{ id: String(userSetting.userId), deviceToken: userSetting.deviceTokenList[0] }],
                    {
                         title: 'New Appointment Booked',
                         body: `Appointment booked for ${date} at ${timeSlot}`,
                    },
                    userSetting.deviceTokenList,
                    'multiple',
                    { appointmentId: String(appointment._id) },
               );
          }
          await Notification.create({
               title: 'New Appointment Booked',
               message: `Appointment booked for ${date} at ${timeSlot}`,
               receiver: userSetting.userId,
               type: 'APPOINTMENT',
               read: false,
          });
     }

     return appointment;
};

const getUserAppointmentsFromDB = async (userId: string): Promise<IAppointment[]> => {
     const appointments = await Appointment.find({ userId });
     if (!appointments.length) {
          throw new AppError(StatusCodes.NOT_FOUND, 'No appointments found for this user');
     }
     return appointments;
};
const getAllAppointmentsFromDB = async (query: any): Promise<IAppointment[]> => {
     // const appointments = await Appointment.find().populate('userId','name email image');
     const appointments = new QueryBuilder(Appointment.find(), query).search(['name', 'email']).filter().sort().fields().modelQuery.populate('userId', 'name email image');
     return appointments;
};

const getSingleAppointmentFromDB = async (id: string): Promise<IAppointment | null> => {
     const appointment = await Appointment.findById(id);
     if (!appointment) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Appointment not found');
     }
     return appointment;
};

const updateAppointmentToDB = async (id: string, payload: Partial<IAppointment>): Promise<IAppointment | null> => {
     // Retrieve the existing appointment
     const appointment = await Appointment.findById(id);
     if (!appointment) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Appointment not found');
     }

     // Handle case where appointment time or date is updated
     const newDate = (payload as any).date;
     const newTime = (payload as any).time;
     const oldDate = appointment.get('date');
     const oldTime = appointment.get('time');

     // If the date or time is updated, validate and check for double booking
     if (newDate || newTime) {
          // Validate new date if provided
          if (newDate) {
               const parsedDate = new Date(newDate);
               if (isNaN(parsedDate.getTime())) {
                    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid date format');
               }
          }
          // Validate new time if provided
          if (newTime) {
               const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
               if (!timeRegex.test(newTime)) {
                    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid time format (expected HH:mm or HH:mm:ss)');
               }
          }

          // Check if another appointment already exists for the new date and time
          const checkDate = newDate || oldDate;
          const checkTime = newTime || oldTime;
          const existingAppointment = await Appointment.findOne({ date: checkDate, time: checkTime, _id: { $ne: id } });
          if (existingAppointment) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Time slot already booked');
          }

          // Update the appointment with new details
          appointment.set('date', newDate || oldDate);
          appointment.set('time', newTime || oldTime);
          const updatedAppointment = await appointment.save();
          return updatedAppointment;
     }

     // If the date and time are not updated, simply update other fields
     const updated = await Appointment.findByIdAndUpdate(id, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update appointment');
     }
     return updated;
};

const deleteAppointmentFromDB = async (id: string): Promise<boolean> => {
     const deleted = await Appointment.findByIdAndDelete(id);
     if (!deleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Appointment not found');
     }
     return true;
};

export const AppointmentService = {
     createAppointmentToDB,
     getUserAppointmentsFromDB,
     getSingleAppointmentFromDB,
     updateAppointmentToDB,
     deleteAppointmentFromDB,
     getAllAppointmentsFromDB,
};
