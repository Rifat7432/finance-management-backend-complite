import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';

const router = express.Router();

router.post('/login', validateRequest(AuthValidation.createLoginZodSchema), AuthController.loginUser);
router.post('/refresh-token', AuthController.refreshToken);

router.post('/verify-email', validateRequest(AuthValidation.createVerifyEmailZodSchema), AuthController.verifyEmail);

router.post('/reset-password', validateRequest(AuthValidation.createResetPasswordZodSchema), AuthController.resetPassword);

router.post('/change-password', auth(USER_ROLES.ADMIN, USER_ROLES.USER), validateRequest(AuthValidation.createChangePasswordZodSchema), AuthController.changePassword);

// OTP sending api
router.post('/forget-password', validateRequest(AuthValidation.createForgetPasswordZodSchema), AuthController.forgetPassword);

router.post('/resend-otp', validateRequest(AuthValidation.createForgetPasswordZodSchema), AuthController.resendOtp);

// reset password by url for admin dashboard

router.post('/dashboard/forget-password', validateRequest(AuthValidation.createForgetPasswordZodSchema), AuthController.forgetPasswordByUrl);

router.post('/dashboard/reset-password', auth(USER_ROLES.ADMIN), validateRequest(AuthValidation.createResetPasswordZodSchema), AuthController.resetPasswordByUrl);
export const AuthRouter = router;
