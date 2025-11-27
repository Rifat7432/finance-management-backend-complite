import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';
import config from '../../../config';
import bcrypt from 'bcrypt';
const createUser = catchAsync(async (req, res) => {
     const { ...userData } = req.body;
     await UserService.createUserToDB(userData);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Account created. Please verify your email',
          data: null,
     });
});
const createUserByApple = catchAsync(async (req, res) => {
     const userData = req.body;
     const result = await UserService.handleAppleAuthentication(userData);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: result.message ? result.message : 'User logged in',
          data: result,
     });
});
const createUserByGoogle = catchAsync(async (req, res) => {
     const userData = req.body;
     const result = await UserService.handleGoogleAuthentication(userData);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: result.message ? result.message : 'User logged in',
          data: result,
     });
});
const getAllUsers = catchAsync(async (req, res) => {
     const result = await UserService.getUsersWithSubscriptionsFromDB(req.query);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'User with subscriptions retrieved',
          data: result,
     });
});
const getUserProfile = catchAsync(async (req, res) => {
     const user: any = req.user;

     const result = await UserService.getUserProfileFromDB(user);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Profile data retrieved',
          data: result,
     });
});
const getUser = catchAsync(async (req, res) => {
     const id: string = req.params.id;

     const result = await UserService.getUserFromDB(id);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Profile data retrieved',
          data: result,
     });
});

//update profile
const updateProfile = catchAsync(async (req, res) => {
     const user: any = req.user;
     if ('role' in req.body) {
          delete req.body.role;
     }
     // If password is provided
     if (req.body.password) {
          req.body.password = await bcrypt.hash(req.body.password, Number(config.bcrypt_salt_rounds));
     }

     const result = await UserService.updateProfileToDB(user, req.body);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Profile updated',
          data: result,
     });
});
//delete profile
const deleteProfile = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const result = await UserService.deleteUser(id);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Profile deleted',
          data: result,
     });
});
//delete profile
const blockUser = catchAsync(async (req, res) => {
     const id: string = req.params.id;
     const result = await UserService.blockUserToDB(id);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'User blocked',
          data: result,
     });
});

export const UserController = {
     createUser,
     getUserProfile,
     updateProfile,
     deleteProfile,
     createUserByGoogle,
     createUserByApple,
     getAllUsers,
     getUser,
     blockUser,
};
