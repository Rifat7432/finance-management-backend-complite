"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const emailHelper_1 = require("../../../helpers/emailHelper");
const jwtHelper_1 = require("../../../helpers/jwtHelper");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const resetToken_model_1 = require("../resetToken/resetToken.model");
const user_model_1 = require("../user/user.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const generateOTP_1 = __importDefault(require("../../../utils/generateOTP"));
const cryptoToken_1 = __importDefault(require("../../../utils/cryptoToken"));
const verifyToken_1 = require("../../../utils/verifyToken");
const createToken_1 = require("../../../utils/createToken");
const notificationSettings_model_1 = require("../notificationSettings/notificationSettings.model");
//login
const loginUserFromDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = payload;
    if (!password) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Password is required!');
    }
    const isExistUser = yield user_model_1.User.findOne({ email, isDeleted: false }).select('+password');
    if (!isExistUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    //check verified and status
    if (!isExistUser.verified) {
        //send mail
        const otp = (0, generateOTP_1.default)(4);
        const value = { otp, email: isExistUser.email };
        const forgetPassword = emailTemplate_1.emailTemplate.resetPassword(value);
        yield emailHelper_1.emailHelper.sendEmail(forgetPassword);
        //save to DB
        const authentication = { oneTimeCode: otp, expireAt: new Date(Date.now() + 5 * 60000) };
        yield user_model_1.User.findOneAndUpdate({ email }, { $set: { authentication } });
        throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Please verify your account, then try to login again');
    }
    //check user status
    if ((isExistUser === null || isExistUser === void 0 ? void 0 : isExistUser.status) === 'blocked') {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You don’t have permission to access this content.It looks like your account has been blocked.');
    }
    // Check if the user is blocked
    if (isExistUser.authProvider !== 'local') {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Wrong Login Method!');
    }
    //check match password
    if (!(yield user_model_1.User.isMatchPassword(password, isExistUser.password))) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Password is incorrect!');
    }
    if (payload.deviceToken) {
        const notificationSettings = yield notificationSettings_model_1.NotificationSettings.findOne({ userId: isExistUser._id });
        if (notificationSettings) {
            const deviceTokens = (notificationSettings === null || notificationSettings === void 0 ? void 0 : notificationSettings.deviceTokenList) || [];
            if (deviceTokens.includes(payload.deviceToken) === false) {
                deviceTokens.push(payload.deviceToken);
                notificationSettings.deviceTokenList = deviceTokens;
                yield notificationSettings.save();
            }
        }
        else {
            yield notificationSettings_model_1.NotificationSettings.create({ userId: isExistUser._id, deviceTokens: [payload.deviceToken] });
        }
    }
    const jwtData = { id: isExistUser._id, role: isExistUser.role, email: isExistUser.email };
    //create token
    const accessToken = jwtHelper_1.jwtHelper.createToken(jwtData, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
    const refreshToken = jwtHelper_1.jwtHelper.createToken(jwtData, config_1.default.jwt.jwt_refresh_secret, config_1.default.jwt.jwt_refresh_expire_in);
    return { accessToken, refreshToken };
});
//forget password
const forgetPasswordToDB = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistUser = yield user_model_1.User.isExistUserByEmail(email);
    if (!isExistUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    //send mail
    const otp = (0, generateOTP_1.default)(4);
    const value = { otp, email: isExistUser.email };
    const forgetPassword = emailTemplate_1.emailTemplate.resetPassword(value);
    yield emailHelper_1.emailHelper.sendEmail(forgetPassword);
    //save to DB
    const authentication = { oneTimeCode: otp, expireAt: new Date(Date.now() + 5 * 60000) };
    yield user_model_1.User.findOneAndUpdate({ email }, { $set: { authentication } });
});
// resend otp
const resendOtpFromDb = (email) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if the user exists
    const isExistUser = yield user_model_1.User.isExistUserByEmail(email);
    if (!isExistUser || !isExistUser._id) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    // send email
    const otp = (0, generateOTP_1.default)(4);
    const values = { name: isExistUser.name, otp: otp, email: isExistUser.email };
    const createAccountTemplate = emailTemplate_1.emailTemplate.createAccount(values);
    yield emailHelper_1.emailHelper.sendEmail(createAccountTemplate);
    //save to DB
    const authentication = { oneTimeCode: otp, expireAt: new Date(Date.now() + 5 * 60000) };
    yield user_model_1.User.findOneAndUpdate({ _id: isExistUser._id }, { $set: { authentication } });
});
//forget password by email url
const forgetPasswordByUrlToDB = (email) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if the user exists
    const isExistUser = yield user_model_1.User.isExistUserByEmail(email);
    if (!isExistUser || !isExistUser._id) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    // Check if the user is blocked
    if (isExistUser.status === 'blocked') {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'This user is blocked!');
    }
    // Generate JWT token for password reset valid for 10 minutes
    const jwtPayload = { id: isExistUser._id, email: isExistUser.email, role: isExistUser.role };
    const resetToken = (0, createToken_1.createToken)(jwtPayload, config_1.default.jwt.jwt_secret, config_1.default.reset_pass_expire_time);
    // Construct password reset URL
    const resetUrl = `${config_1.default.frontend_url}/auth/reset-password?email=${isExistUser.email}&token=${resetToken}`;
    // Prepare email template
    const forgetPasswordEmail = emailTemplate_1.emailTemplate.resetPasswordByUrl({ email: isExistUser.email, resetUrl });
    // Send reset email
    yield yield emailHelper_1.emailHelper.sendEmail(forgetPasswordEmail);
});
//verify email
const verifyEmailToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { email, oneTimeCode } = payload;
    const isExistUser = yield user_model_1.User.findOne({ email }).select('+authentication');
    if (!isExistUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    if (!oneTimeCode) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please give the otp, check your email we send a code');
    }
    if (((_a = isExistUser.authentication) === null || _a === void 0 ? void 0 : _a.oneTimeCode) !== oneTimeCode) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You provided wrong otp');
    }
    const date = new Date();
    if (date > ((_b = isExistUser.authentication) === null || _b === void 0 ? void 0 : _b.expireAt)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Otp already expired, Please try again');
    }
    let message;
    let verifyToken;
    let accessToken;
    let user;
    if (!isExistUser.verified) {
        yield user_model_1.User.findOneAndUpdate({ _id: isExistUser._id }, { verified: true, authentication: { oneTimeCode: null, expireAt: null } });
        //create token
        accessToken = jwtHelper_1.jwtHelper.createToken({ id: isExistUser._id, role: isExistUser.role, email: isExistUser.email }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
        message = 'Email verify successfully';
        user = yield user_model_1.User.findById(isExistUser._id);
    }
    else {
        yield user_model_1.User.findOneAndUpdate({ _id: isExistUser._id }, { authentication: { isResetPassword: true, oneTimeCode: null, expireAt: null } });
        //create token ;
        const createToken = (0, cryptoToken_1.default)();
        yield resetToken_model_1.ResetToken.create({ user: isExistUser._id, token: createToken, expireAt: new Date(Date.now() + 5 * 60000) });
        message = 'Verification Successful: Please securely store and utilize this code for reset password';
        verifyToken = createToken;
    }
    return { verifyToken, message, accessToken, user };
});
//reset password
const resetPasswordToDB = (token, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { newPassword, confirmPassword } = payload;
    //isExist token
    const isExistToken = yield resetToken_model_1.ResetToken.findOne({ token });
    if (!isExistToken) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'You are not authorized');
    }
    //user permission check
    const isExistUser = yield user_model_1.User.findById(isExistToken.user).select('+authentication');
    if (!((_a = isExistUser === null || isExistUser === void 0 ? void 0 : isExistUser.authentication) === null || _a === void 0 ? void 0 : _a.isResetPassword)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "You don't have permission to change the password. Please click again to 'Forgot Password'");
    }
    //validity check
    const isValid = yield resetToken_model_1.ResetToken.isExpireToken(token);
    if (!isValid) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Token expired, Please click again to the forget password');
    }
    //check password
    if (newPassword !== confirmPassword) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "New password and Confirm password doesn't match!");
    }
    const hashPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    const updateData = { password: hashPassword, authentication: { isResetPassword: false } };
    yield user_model_1.User.findOneAndUpdate({ _id: isExistToken.user }, updateData, { new: true });
});
// reset password by url
const resetPasswordByUrl = (token, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { newPassword, confirmPassword } = payload;
    let decodedToken;
    try {
        decodedToken = yield (0, verifyToken_1.verifyToken)(token, config_1.default.jwt.jwt_secret);
    }
    catch (error) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid or expired token.');
    }
    const { id } = decodedToken;
    // Check if user exists
    const user = yield user_model_1.User.findById(id);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User not found.');
    }
    // Check if passwords match
    if (newPassword !== confirmPassword) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "New password and Confirm password don't match!");
    }
    // Hash New Password
    const hashPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    // Update Password
    yield user_model_1.User.findByIdAndUpdate(id, { password: hashPassword, authentication: { isResetPassword: false } }, { new: true, runValidators: true });
    // Return Success Response
    return { message: 'Password reset successful. You can now log in with your new password.' };
});
const changePasswordToDB = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentPassword, newPassword, confirmPassword } = payload;
    const isExistUser = yield user_model_1.User.findById(user.id).select('+password');
    if (!isExistUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    //current password match
    if (currentPassword && !(yield user_model_1.User.isMatchPassword(currentPassword, isExistUser.password))) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Password is incorrect');
    }
    //newPassword and current password
    if (currentPassword === newPassword) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please give different password from current password');
    }
    //new password and confirm password check
    if (newPassword !== confirmPassword) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Password and Confirm password doesn't matched");
    }
    //hash password
    const hashPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    const updateData = { password: hashPassword };
    const result = yield user_model_1.User.findOneAndUpdate({ _id: user.id }, updateData, { new: true });
    return result;
});
// Refresh token
const refreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!token) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Token not found');
    }
    const decoded = (0, verifyToken_1.verifyToken)(token, config_1.default.jwt.jwt_refresh_secret);
    const { id } = decoded;
    const activeUser = yield user_model_1.User.findById(id);
    if (!activeUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    if (activeUser.status !== 'active') {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'User account is inactive');
    }
    if (!activeUser.verified) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'User account is not verified');
    }
    if (activeUser.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'User account is deleted');
    }
    const jwtPayload = { id: (_a = activeUser === null || activeUser === void 0 ? void 0 : activeUser._id) === null || _a === void 0 ? void 0 : _a.toString(), role: activeUser === null || activeUser === void 0 ? void 0 : activeUser.role, email: activeUser.email };
    const accessToken = jwtHelper_1.jwtHelper.createToken(jwtPayload, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
    return { accessToken };
});
exports.AuthService = { verifyEmailToDB, loginUserFromDB, forgetPasswordToDB, resetPasswordToDB, changePasswordToDB, forgetPasswordByUrlToDB, resetPasswordByUrl, resendOtpFromDb, refreshToken };
