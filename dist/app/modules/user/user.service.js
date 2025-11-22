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
exports.UserService = exports.getUsersWithSubscriptionsFromDB = void 0;
const http_status_codes_1 = require("http-status-codes");
const user_1 = require("../../../enums/user");
const emailHelper_1 = require("../../../helpers/emailHelper");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const user_model_1 = require("./user.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const generateOTP_1 = __importDefault(require("../../../utils/generateOTP"));
const config_1 = __importDefault(require("../../../config"));
const jwtHelper_1 = require("../../../helpers/jwtHelper");
const uploadFileToSpaces_1 = require("../../middleware/uploadFileToSpaces");
const notificationSettings_model_1 = require("../notificationSettings/notificationSettings.model");
// create user
const createUserToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    //set role
    const user = yield user_model_1.User.isExistUserByEmail(payload.email);
    if (user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Email already exists');
    }
    payload.role = user_1.USER_ROLES.USER;
    const createUser = yield user_model_1.User.create(payload);
    if (!createUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create user');
    }
    //send email
    const otp = (0, generateOTP_1.default)(4);
    const values = {
        name: createUser.name,
        otp: otp,
        email: createUser.email,
    };
    const createAccountTemplate = emailTemplate_1.emailTemplate.createAccount(values);
    yield emailHelper_1.emailHelper.sendEmail(createAccountTemplate);
    //save to DB
    const authentication = {
        oneTimeCode: otp,
        expireAt: new Date(Date.now() + 5 * 60000),
    };
    yield user_model_1.User.findOneAndUpdate({ _id: createUser._id }, { $set: { authentication } });
    yield notificationSettings_model_1.NotificationSettings.create({ userId: createUser._id });
    return createUser;
});
const handleAppleAuthentication = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, appleId, fullName } = payload;
    // Check if the user already exists by Apple ID or email
    const existingUser = yield user_model_1.User.findOne({ email }).select('+password');
    // If user doesn't exist, treat it as a sign-up
    if (!existingUser) {
        // Check if the user is signing up with Apple and email is not already in use
        const userExists = yield user_model_1.User.isExistUserByEmail(email);
        if (userExists) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Email already exists');
        }
        // Create the new user
        const newUser = yield user_model_1.User.create({
            email,
            socialId: appleId,
            name: fullName.givenName + ' ' + fullName.familyName,
            authProvider: 'apple',
            password: appleId,
            role: user_1.USER_ROLES.USER, // Default role as User
        });
        if (!newUser) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create user');
        }
        if (payload.deviceToken) {
            const notificationSettings = yield notificationSettings_model_1.NotificationSettings.findOne({ userId: newUser._id });
            if (notificationSettings) {
                const deviceTokens = (notificationSettings === null || notificationSettings === void 0 ? void 0 : notificationSettings.deviceTokenList) || [];
                if (deviceTokens.includes(payload.deviceToken) === false) {
                    deviceTokens.push(payload.deviceToken);
                    notificationSettings.deviceTokenList = deviceTokens;
                    yield notificationSettings.save();
                }
            }
            else {
                yield notificationSettings_model_1.NotificationSettings.create({ userId: newUser._id, deviceTokens: [payload.deviceToken] });
            }
        }
        // Send OTP for email verification
        const otp = (0, generateOTP_1.default)(4);
        const values = {
            name: newUser.name,
            otp,
            email: newUser.email,
        };
        const createAccountTemplate = emailTemplate_1.emailTemplate.createAccount(values);
        yield emailHelper_1.emailHelper.sendEmail(createAccountTemplate);
        // Save OTP for later verification
        const authentication = {
            oneTimeCode: otp,
            expireAt: new Date(Date.now() + 5 * 60000), // OTP expiration time of 3 minutes
        };
        yield user_model_1.User.findOneAndUpdate({ _id: newUser._id }, { $set: { authentication } });
        return { message: 'Account created successfully, please verify via OTP' };
    }
    // If user exists, perform login
    if (existingUser) {
        // check verified and status
        if (!existingUser.verified) {
            //send mail
            const otp = (0, generateOTP_1.default)(4);
            const value = { otp, email: existingUser.email };
            const forgetPassword = emailTemplate_1.emailTemplate.resetPassword(value);
            yield emailHelper_1.emailHelper.sendEmail(forgetPassword);
            //save to DB
            const authentication = { oneTimeCode: otp, expireAt: new Date(Date.now() + 5 * 60000) };
            yield user_model_1.User.findOneAndUpdate({ email }, { $set: { authentication } });
            throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Please verify your account, then try to login again');
        }
        // check user status
        if ((existingUser === null || existingUser === void 0 ? void 0 : existingUser.status) === 'blocked') {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You don’t have permission to access this content. It looks like your account has been blocked.');
        }
        const jwtData = { id: existingUser._id, role: existingUser.role, email: existingUser.email };
        // create token
        const accessToken = jwtHelper_1.jwtHelper.createToken(jwtData, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
        const refreshToken = jwtHelper_1.jwtHelper.createToken(jwtData, config_1.default.jwt.jwt_refresh_secret, config_1.default.jwt.jwt_refresh_expire_in);
        return { accessToken, refreshToken };
    }
    throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'An unknown error occurred');
});
const handleGoogleAuthentication = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, googleId, email_verified, name } = payload;
    // Check if the user already exists by Google ID or email
    const existingUser = yield user_model_1.User.findOne({ email }).select('+password');
    // If user doesn't exist, treat it as a sign-up
    if (!existingUser) {
        // Check if the user is signing up with Google and email is not already in use
        const userExists = yield user_model_1.User.isExistUserByEmail(email);
        if (userExists) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Email already exists');
        }
        // Create the new user
        const newUser = yield user_model_1.User.create({
            image: (payload === null || payload === void 0 ? void 0 : payload.picture) || '',
            email,
            socialId: googleId,
            verified: email_verified,
            name,
            password: googleId,
            authProvider: 'google',
            role: user_1.USER_ROLES.USER, // Default role as User
        });
        if (!newUser) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create user');
        }
        if (payload.deviceToken) {
            const notificationSettings = yield notificationSettings_model_1.NotificationSettings.findOne({ userId: newUser._id });
            if (notificationSettings) {
                const deviceTokens = (notificationSettings === null || notificationSettings === void 0 ? void 0 : notificationSettings.deviceTokenList) || [];
                if (deviceTokens.includes(payload.deviceToken) === false) {
                    deviceTokens.push(payload.deviceToken);
                    notificationSettings.deviceTokenList = deviceTokens;
                    yield notificationSettings.save();
                }
            }
            else {
                yield notificationSettings_model_1.NotificationSettings.create({ userId: newUser._id, deviceTokens: [payload.deviceToken] });
            }
        }
        // Send OTP for email verification
        const otp = (0, generateOTP_1.default)(4);
        const values = {
            name: newUser.name,
            otp,
            email: newUser.email,
        };
        const createAccountTemplate = emailTemplate_1.emailTemplate.createAccount(values);
        yield emailHelper_1.emailHelper.sendEmail(createAccountTemplate);
        // Save OTP for later verification
        const authentication = {
            oneTimeCode: otp,
            expireAt: new Date(Date.now() + 5 * 60000), // OTP expiration time of 3 minutes
        };
        yield user_model_1.User.findOneAndUpdate({ _id: newUser._id }, { $set: { authentication } });
        return { message: 'Account created successfully, please verify via OTP' };
    }
    // If user exists, perform login
    if (existingUser) {
        // check verified and status
        if (!existingUser.verified) {
            //send mail
            const otp = (0, generateOTP_1.default)(4);
            const value = { otp, email: existingUser.email };
            const forgetPassword = emailTemplate_1.emailTemplate.resetPassword(value);
            yield emailHelper_1.emailHelper.sendEmail(forgetPassword);
            //save to DB
            const authentication = { oneTimeCode: otp, expireAt: new Date(Date.now() + 5 * 60000) };
            yield user_model_1.User.findOneAndUpdate({ email }, { $set: { authentication } });
            throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Please verify your account, then try to login again');
        }
        // check user status
        if ((existingUser === null || existingUser === void 0 ? void 0 : existingUser.status) === 'blocked') {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You don’t have permission to access this content. It looks like your account has been blocked.');
        }
        const jwtData = { id: existingUser._id, role: existingUser.role, email: existingUser.email };
        // create token
        const accessToken = jwtHelper_1.jwtHelper.createToken(jwtData, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
        const refreshToken = jwtHelper_1.jwtHelper.createToken(jwtData, config_1.default.jwt.jwt_refresh_secret, config_1.default.jwt.jwt_refresh_expire_in);
        return { accessToken, refreshToken };
    }
    throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'An unknown error occurred');
});
// get user profile
const getUserProfileFromDB = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = user;
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser && isExistUser.isDeleted === true) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    return isExistUser;
});
const getUserFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser && isExistUser.isDeleted === true) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    return isExistUser;
});
const getUsersWithSubscriptionsFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm: search, status: filterStatus = 'all', page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const searchFilter = search
        ? {
            $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }],
        }
        : {};
    const userFilter = Object.assign({ role: user_1.USER_ROLES.USER, status: 'active', isDeleted: false }, searchFilter);
    const pipeline = [
        // Step 1: Filter users
        { $match: userFilter },
        // Step 2: Join with subscriptions
        {
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'userId',
                as: 'subscriptions',
            },
        },
        // Step 3: Sort subscriptions by createdAt descending
        {
            $addFields: {
                subscriptions: { $sortArray: { input: '$subscriptions', sortBy: { createdAt: -1 } } },
                latestSubscription: { $arrayElemAt: ['$subscriptions', 0] },
            },
        },
        // Step 4: Filter by subscription status
        {
            $match: filterStatus === 'all'
                ? {} // no extra filtering
                : filterStatus === 'active'
                    ? { 'latestSubscription.status': 'active' }
                    : filterStatus === 'expired'
                        ? { 'latestSubscription.expiryDate': { $lt: new Date() }, 'latestSubscription.status': 'expired' }
                        : filterStatus === 'inactive'
                            ? { latestSubscription: { $exists: false } }
                            : {},
        },
        // Step 5: Project fields
        {
            $project: {
                image: 1,
                name: 1,
                email: 1,
                phoneNumber: '$phone',
                subscriptions: {
                    $ifNull: [
                        {
                            $cond: {
                                if: { $ifNull: ['$latestSubscription.status', false] },
                                then: {
                                    $concat: [
                                        { $toUpper: { $substrCP: ['$latestSubscription.status', 0, 1] } },
                                        { $substrCP: ['$latestSubscription.status', 1, { $strLenCP: '$latestSubscription.status' }] },
                                    ],
                                },
                                else: 'Inactive',
                            },
                        },
                        'Inactive',
                    ],
                },
                StartDate: { $ifNull: ['$latestSubscription.createdAt', null] },
                EndDate: { $ifNull: ['$latestSubscription.expiryDate', null] },
            },
        },
        // Step 6: Sort users by creation date
        { $sort: { createdAt: -1 } },
        // Step 7: Pagination
        { $skip: skip },
        { $limit: parseInt(limit) },
    ];
    const users = yield user_model_1.User.aggregate(pipeline);
    return users.map((u) => (Object.assign(Object.assign({}, u), { StartDate: u.StartDate ? new Date(u.StartDate).toDateString() : null, EndDate: u.EndDate ? new Date(u.EndDate).toDateString() : null })));
});
exports.getUsersWithSubscriptionsFromDB = getUsersWithSubscriptionsFromDB;
// update user profile
const updateProfileToDB = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = user;
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser && isExistUser.isDeleted === true) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    //unlink file here
    if (payload.image) {
        (0, uploadFileToSpaces_1.deleteFileFromSpaces)(isExistUser.image);
    }
    const updateDoc = yield user_model_1.User.findOneAndUpdate({ _id: id }, payload, {
        new: true,
    });
    return updateDoc;
});
const verifyUserPassword = (userId, password) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select('+password');
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found.');
    }
    const isPasswordValid = yield user_model_1.User.isMatchPassword(password, user.password);
    return isPasswordValid;
});
const blockUserToDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    if (isExistUser.role === user_1.USER_ROLES.ADMIN) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You don't have permission to delete this user!");
    }
    yield user_model_1.User.findByIdAndUpdate(id, {
        $set: { status: 'blocked' },
    });
    return true;
});
const deleteUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    if (isExistUser.role === user_1.USER_ROLES.ADMIN) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You don't have permission to block this user!");
    }
    yield user_model_1.User.findByIdAndUpdate(id, {
        $set: { isDeleted: true },
    });
    return true;
});
exports.UserService = {
    createUserToDB,
    getUserProfileFromDB,
    updateProfileToDB,
    deleteUser,
    verifyUserPassword,
    handleAppleAuthentication,
    handleGoogleAuthentication,
    getUsersWithSubscriptionsFromDB: exports.getUsersWithSubscriptionsFromDB,
    getUserFromDB,
    blockUserToDB,
};
