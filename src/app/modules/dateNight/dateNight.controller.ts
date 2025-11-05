import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { DateNightService } from './dateNight.service';

const createDateNight = catchAsync(async (req, res) => {
  const user = req.user
  const result = await DateNightService.createDateNightToDB(user.id,req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Date night created successfully',
    data: result,
  });
});

const getDateNights = catchAsync(async (req, res) => {
   const user = req.user
  const result = await DateNightService.getDateNightsFromDB(user.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Date nights retrieved successfully',
    data: result,
  });
});

const getSingleDateNight = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await DateNightService.getSingleDateNightFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Date night retrieved successfully',
    data: result,
  });
});

const updateDateNight = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await DateNightService.updateDateNightToDB(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Date night updated successfully',
    data: result,
  });
});

const deleteDateNight = catchAsync(async (req, res) => {
  const { id } = req.params;
  await DateNightService.deleteDateNightFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Date night deleted successfully',
  });
});

export const DateNightController = {
  createDateNight,
  getDateNights,
  getSingleDateNight,
  updateDateNight,
  deleteDateNight,
};
