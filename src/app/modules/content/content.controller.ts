import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ContentService } from './content.service';

const createContent = catchAsync(async (req, res) => {
  const result = await ContentService.createContentToDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Content created successfully',
    data: result,
  });
});

const getContents = catchAsync(async (req, res) => {
  const result = await ContentService.getContentsFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Contents retrieved successfully',
    data: result,
  });
});

const getSingleContent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ContentService.getSingleContentFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Content retrieved successfully',
    data: result,
  });
});

const updateContent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ContentService.updateContentToDB(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Content updated successfully',
    data: result,
  });
});

const deleteContent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await ContentService.deleteContentFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Content deleted successfully',
  });
});

export const ContentController = {
  createContent,
  getContents,
  getSingleContent,
  updateContent,
  deleteContent,
};
