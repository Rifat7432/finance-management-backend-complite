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
exports.PartnerRequestService = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const partnerRequest_model_1 = require("./partnerRequest.model");
const user_model_1 = require("../user/user.model");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const emailHelper_1 = require("../../../helpers/emailHelper");
const user_1 = require("../../../enums/user");
const mongoose_1 = __importDefault(require("mongoose"));
const createPartnerRequestToDB = (inviterId, partnerData) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const inviter = yield user_model_1.User.findById(inviterId);
    if (!inviter)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Inviter not found');
    if (inviter.partnerId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'You are already partnered with someone');
    }
    // Check if partner user already exists
    const existingUser = yield user_model_1.User.findOne({ email: partnerData.email });
    if (existingUser) {
        const isRequestExist = yield partnerRequest_model_1.PartnerRequest.findOne({
            $or: [
                { fromUser: inviterId, toUser: existingUser._id },
                { fromUser: existingUser._id, toUser: inviterId },
            ],
        });
        if (isRequestExist) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'A partner request already exists between you and this user');
        }
        // Check if already partners
        if (((_a = existingUser.partnerId) === null || _a === void 0 ? void 0 : _a.toString()) === inviterId) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Already partners with this user');
        }
        // If the partner is registered but not yet linked with another user, create a partner request
        if (!existingUser.partnerId) {
            // Create Partner Request
            const request = yield partnerRequest_model_1.PartnerRequest.create({
                fromUser: inviterId,
                toUser: existingUser._id,
                email: partnerData.email,
                relation: partnerData.relation,
            });
            // Send email notification to the partner about the request
            const emailContent = emailTemplate_1.emailTemplate.partnerRequest({
                name: existingUser.name,
                email: existingUser.email,
                inviterName: inviter.name,
                relation: partnerData.relation,
                requestId: request._id,
            });
            yield emailHelper_1.emailHelper.sendEmail(emailContent);
            return request;
        }
        else {
            // If the partner is already linked with another user, throw an error
            throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'This user is already partnered with someone else');
        }
    }
    else {
        // Partner is not registered, create a new user with default password
        const defaultPassword = '12345678'; // 8 chars random password
        const newPartner = yield user_model_1.User.create({
            name: partnerData.name,
            email: partnerData.email,
            password: defaultPassword,
            role: user_1.USER_ROLES.USER,
        });
        yield partnerRequest_model_1.PartnerRequest.create({
            fromUser: inviterId,
            toUser: newPartner._id,
            email: partnerData.email,
            relation: partnerData.relation,
        });
        // Send email to the partner with the login details
        const emailContent = emailTemplate_1.emailTemplate.partnerInvite({
            name: partnerData.name,
            inviterName: inviter.name,
            email: partnerData.email,
            password: defaultPassword,
        });
        yield emailHelper_1.emailHelper.sendEmail(emailContent);
        return newPartner;
    }
});
// Function to accept partner request
const acceptPartnerRequestToDB = (requestId, partnerId) => __awaiter(void 0, void 0, void 0, function* () {
    // Fetch the partner request
    const partnerRequest = yield partnerRequest_model_1.PartnerRequest.findById(requestId);
    if (!partnerRequest) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Partner request not found');
    }
    // Ensure the correct user is accepting
    if (!partnerRequest.toUser || partnerRequest.toUser.toString() !== partnerId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not authorized to accept this request');
    }
    const inviter = yield user_model_1.User.findById(partnerRequest.fromUser);
    const partner = yield user_model_1.User.findById(partnerId);
    if (!inviter || !partner) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User(s) not found');
    }
    if (partner.partnerId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You are already partnered with someone');
    }
    if (inviter.partnerId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Inviter is already partnered with someone');
    }
    // Link users
    yield user_model_1.User.findByIdAndUpdate(inviter._id, { partnerId: partner._id });
    yield user_model_1.User.findByIdAndUpdate(partner._id, { partnerId: inviter._id });
    // Update this request as accepted
    partnerRequest.status = 'accepted';
    yield partnerRequest.save();
    // DELETE all other partner requests involving either user EXCEPT THIS ONE
    yield partnerRequest_model_1.PartnerRequest.deleteMany({
        _id: { $ne: requestId }, // skip the accepted one
        $or: [{ fromUser: inviter._id }, { toUser: inviter._id }, { fromUser: partner._id }, { toUser: partner._id }],
    });
    return {
        inviter,
        partner,
        message: 'Partner request accepted, users linked, and all other requests removed.',
    };
});
const getPartnerRequestsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Fetch the user first (to check partnerId)
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    // If user already has a partner, return their accepted partner request
    if (user.partnerId) {
        const partnerId = user.partnerId.toString();
        const acceptedRequest = yield partnerRequest_model_1.PartnerRequest.findOne({
            $or: [
                { fromUser: userId, toUser: partnerId },
                { fromUser: partnerId, toUser: userId },
            ],
            status: 'accepted',
        });
        const partnerInfo = yield user_model_1.User.findById(user.partnerId).select('name email image');
        return {
            incoming: [],
            outgoing: [],
            partnerRequest: acceptedRequest || null,
            partnerInfo,
        };
    }
    // If no partnerId → return pending requests
    const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
    const partnerRequests = yield partnerRequest_model_1.PartnerRequest.aggregate([
        // Match pending requests where user is either sender or receiver
        {
            $match: {
                status: 'pending',
                $or: [{ fromUser: userObjectId }, { toUser: userObjectId }],
            },
        },
        // Lookup fromUser details from users collection
        {
            $lookup: {
                from: 'users',
                localField: 'fromUser',
                foreignField: '_id',
                as: 'fromUserDetails',
            },
        },
        {
            $unwind: {
                path: '$fromUserDetails',
                preserveNullAndEmptyArrays: true,
            },
        },
        // Lookup toUser details from users collection (if toUser exists)
        {
            $lookup: {
                from: 'users',
                localField: 'toUser',
                foreignField: '_id',
                as: 'toUserDetails',
            },
        },
        {
            $unwind: {
                path: '$toUserDetails',
                preserveNullAndEmptyArrays: true,
            },
        },
        // Determine if request is outgoing (current user is sender)
        {
            $addFields: {
                isOutgoing: { $eq: ['$fromUser', userObjectId] },
            },
        },
        // Shape the data based on direction
        {
            $project: {
                isOutgoing: 1,
                // Structure for outgoing requests (sent by current user)
                outgoingRequest: {
                    $cond: [
                        '$isOutgoing',
                        {
                            _id: '$_id',
                            fromUser: '$fromUser',
                            // Use recipient's name from User collection if registered, else use stored name
                            name: {
                                $cond: [{ $ifNull: ['$toUser', false] }, '$toUserDetails.name', '$name'],
                            },
                            // Use recipient's email from User collection if registered, else use stored email
                            email: {
                                $cond: [{ $ifNull: ['$toUser', false] }, '$toUserDetails.email', '$email'],
                            },
                            // Use recipient's image from User collection if registered
                            image: {
                                $cond: [{ $ifNull: ['$toUser', false] }, { $ifNull: ['$toUserDetails.image', ''] }, ''],
                            },
                            relation: '$relation',
                            status: '$status',
                            createdAt: '$createdAt',
                            updatedAt: '$updatedAt',
                            __v: '$__v',
                        },
                        null,
                    ],
                },
                // Structure for incoming requests (received by current user)
                incomingRequest: {
                    $cond: [
                        { $not: '$isOutgoing' },
                        {
                            _id: '$_id',
                            toUser: '$toUser',
                            // Sender's name from User collection or stored name
                            name: { $ifNull: ['$fromUserDetails.name', '$name'] },
                            // Sender's email from User collection
                            senderEmail: { $ifNull: ['$fromUserDetails.email', '$email'] },
                            // Email field from document (where invitation was sent)
                            email: '$email',
                            // Sender's image
                            image: { $ifNull: ['$fromUserDetails.image', ''] },
                            relation: '$relation',
                            status: '$status',
                            createdAt: '$createdAt',
                            updatedAt: '$updatedAt',
                            __v: '$__v',
                        },
                        null,
                    ],
                },
            },
        },
        // Group all results together
        {
            $group: {
                _id: null,
                outgoing: { $push: '$outgoingRequest' },
                incoming: { $push: '$incomingRequest' },
            },
        },
        // Remove null values from arrays
        {
            $project: {
                _id: 0,
                outgoing: {
                    $filter: {
                        input: '$outgoing',
                        as: 'req',
                        cond: { $ne: ['$$req', null] },
                    },
                },
                incoming: {
                    $filter: {
                        input: '$incoming',
                        as: 'req',
                        cond: { $ne: ['$$req', null] },
                    },
                },
            },
        },
    ]);
    // Return the first result or default empty structure
    return Object.assign(Object.assign({}, (partnerRequests.length > 0 ? partnerRequests[0] : { incoming: [], outgoing: [] })), { partnerRequests: null });
});
const getSinglePartnerRequestFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const request = yield partnerRequest_model_1.PartnerRequest.findById(id);
    if (!request) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Partner request not found');
    }
    return request;
});
const UnlinkWithPartnerRequestToDB = (partnerRequestId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Get user
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    // user must already have a partner
    if (!user.partnerId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You do not have a partner');
    }
    // partnerId comes from the user document
    const partnerId = user.partnerId.toString();
    // get partner
    const partner = yield user_model_1.User.findById(partnerId);
    if (!partner) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Partner not found');
    }
    // Find the accepted partner request between these two users
    const request = yield partnerRequest_model_1.PartnerRequest.findById(partnerRequestId);
    if (!request || request.status !== 'accepted') {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Accepted partner request between these users not found');
    }
    // Unlink both users
    yield user_model_1.User.findByIdAndUpdate(userId, { partnerId: null });
    yield user_model_1.User.findByIdAndUpdate(partnerId, { partnerId: null });
    // Delete the partner request
    yield partnerRequest_model_1.PartnerRequest.findByIdAndDelete(request._id);
    return true;
});
const deletePartnerRequestFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const partnerRequest = yield partnerRequest_model_1.PartnerRequest.findById(id);
    const fromUser = yield user_model_1.User.findById(partnerRequest === null || partnerRequest === void 0 ? void 0 : partnerRequest.fromUser);
    const toUser = yield user_model_1.User.findById(partnerRequest === null || partnerRequest === void 0 ? void 0 : partnerRequest.toUser);
    if (((_a = fromUser === null || fromUser === void 0 ? void 0 : fromUser.partnerId) === null || _a === void 0 ? void 0 : _a.toString()) === (partnerRequest === null || partnerRequest === void 0 ? void 0 : partnerRequest.toUser) || ((_b = toUser === null || toUser === void 0 ? void 0 : toUser.partnerId) === null || _b === void 0 ? void 0 : _b.toString()) === (partnerRequest === null || partnerRequest === void 0 ? void 0 : partnerRequest.fromUser)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Cannot delete an active partner request between linked users');
    }
    const deleted = yield partnerRequest_model_1.PartnerRequest.findByIdAndDelete(id);
    if (!deleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Partner request not found');
    }
    return true;
});
exports.PartnerRequestService = {
    createPartnerRequestToDB,
    getPartnerRequestsFromDB,
    getSinglePartnerRequestFromDB,
    UnlinkWithPartnerRequestToDB,
    deletePartnerRequestFromDB,
    acceptPartnerRequestToDB,
};
