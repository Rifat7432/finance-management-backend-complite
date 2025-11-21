import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { PartnerRequestService } from './partnerRequest.service';

const createPartnerRequest = catchAsync(async (req, res) => {
     const userId = req.user?.id;
     const result = await PartnerRequestService.createPartnerRequestToDB(userId, req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.CREATED,
          message: 'Partner request created',
          data: result,
     });
});

const getPartnerRequests = catchAsync(async (req, res) => {
     const userId = req.user?.id;
     const result = await PartnerRequestService.getPartnerRequestsFromDB(userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Partner requests retrieved',
          data: result,
     });
});
const acceptPartnerRequest = catchAsync(async (req, res) => {
     const userId = req.user?.id;
     const result = await PartnerRequestService.acceptPartnerRequestToDB(req.params.id, userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Partner request accepted',
          data: result,
     });
});

const getSinglePartnerRequest = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await PartnerRequestService.getSinglePartnerRequestFromDB(id);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Partner request retrieved',
          data: result,
     });
});

const UnlinkWithPartnerRequest = catchAsync(async (req, res) => {
     const id  = req.params?.partnerId;
     const user = req.user;
     const result = await PartnerRequestService.UnlinkWithPartnerRequestToDB(id, user.id);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Partner request unlinked',
          data: result,
     });
});

const deletePartnerRequest = catchAsync(async (req, res) => {
     const { id } = req.params;
     await PartnerRequestService.deletePartnerRequestFromDB(id);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Partner request deleted',
     });
});

export const PartnerRequestController = {
     createPartnerRequest,
     getPartnerRequests,
     getSinglePartnerRequest,
     UnlinkWithPartnerRequest,
     deletePartnerRequest,
     acceptPartnerRequest,
};
