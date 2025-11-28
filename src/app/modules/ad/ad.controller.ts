import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AdService } from './ad.service';

const createAd = catchAsync(async (req, res) => {
  const result = await AdService.createAdToDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
  message: 'Ad created',
    data: result,
  });
});

const getAds = catchAsync(async (req, res) => {
  const result = await AdService.getAdsFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
  message: 'Ads retrieved',
    data: result,
  });
});

const getSingleAd = catchAsync(async (req, res) => {
  const result = await AdService.getSingleAdFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
  message: 'Ad retrieved',
    data: result,
  });
});

const updateAd = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AdService.updateAdToDB(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
  message: 'Ad updated',
    data: result,
  });
});

const deleteAd = catchAsync(async (req, res) => {
  const { id } = req.params;
  await AdService.deleteAdFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
  message: 'Ad deleted',
  });
});

export const AdController = {
  createAd,
  getAds,
  getSingleAd,
  updateAd,
  deleteAd,
};
