import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AppointmentService } from './appointment.service';

const createAppointment = catchAsync(async (req, res) => {

  const userId = req.user?.id;
  const result = await AppointmentService.createAppointmentToDB(req.body,userId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Time slot booked successfully',
    data: result,
  });
});

const getUserAppointments = catchAsync(async (req, res) => {
  const userId = req.user?.id || req.body.userId;
  const result = await AppointmentService.getUserAppointmentsFromDB(userId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Appointments retrieved successfully',
    data: result,
  });
});
const getAllAppointments = catchAsync(async (req, res) => {
  const result = await AppointmentService.getAllAppointmentsFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Appointments retrieved successfully',
    data: result,
  });
});

const getSingleAppointment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AppointmentService.getSingleAppointmentFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Appointment retrieved successfully',
    data: result,
  });
});

const updateAppointment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AppointmentService.updateAppointmentToDB(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Appointment updated successfully',
    data: result,
  });
});

const deleteAppointment = catchAsync(async (req, res) => {
  const { id } = req.params;
  await AppointmentService.deleteAppointmentFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Appointment deleted successfully',
  });
});

export const AppointmentController = {
  createAppointment,
  getUserAppointments,
  getSingleAppointment,
  updateAppointment,
  deleteAppointment,getAllAppointments
};
