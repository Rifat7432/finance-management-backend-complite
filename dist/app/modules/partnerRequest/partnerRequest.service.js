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
    // Fetch the partner request from the database
    const partnerRequest = yield partnerRequest_model_1.PartnerRequest.findById(requestId);
    if (!partnerRequest) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Partner request not found');
    }
    // Ensure that the partner is the one accepting the request
    if (!partnerRequest.toUser || partnerRequest.toUser.toString() !== partnerId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not authorized to accept this request');
    }
    // Fetch the inviter and the partner (the one accepting the request)
    const inviter = yield user_model_1.User.findById(partnerRequest.fromUser);
    const partner = yield user_model_1.User.findById(partnerId);
    if (!inviter || !partner) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User(s) not found');
    }
    if (partner.partnerId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'You are already partnered with someone');
    }
    if (inviter.partnerId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Partner are already partnered with someone');
    }
    // Link the partner to the inviter (set partnerId)
    inviter.partnerId = partner._id;
    partner.partnerId = inviter._id;
    // Save both inviter and partner with the updated partnerId
    yield inviter.save();
    yield partner.save();
    // Update the partner request status to 'accepted'
    partnerRequest.status = 'accepted';
    yield partnerRequest.save();
    // Optionally, you could send a confirmation email to both users
    // Send emails to both inviter and partner confirming the partnership.
    return {
        inviter,
        partner,
        message: 'Partner request accepted and users are now linked.',
    };
});
const getPartnerRequestsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const requests = yield partnerRequest_model_1.PartnerRequest.find({
        $or: [{ fromUser: userId }, { toUser: userId }],
    })
        .populate('fromUser', 'name email image')
        .populate('toUser', 'name email image');
    return requests;
});
const getSinglePartnerRequestFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const request = yield partnerRequest_model_1.PartnerRequest.findById(id);
    if (!request) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Partner request not found');
    }
    return request;
});
const UnlinkWithPartnerRequestToDB = (partnerId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const user = yield user_model_1.User.findById(userId);
    const partner = yield user_model_1.User.findById(partnerId);
    if (!user || !partner) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User(s) not found');
    }
    if (((_a = user.partnerId) === null || _a === void 0 ? void 0 : _a.toString()) !== partnerId || ((_b = partner.partnerId) === null || _b === void 0 ? void 0 : _b.toString()) !== userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Users are not linked as partners');
    }
    user.partnerId = undefined;
    partner.partnerId = undefined;
    yield user.save();
    yield partner.save();
    const deleted = yield partnerRequest_model_1.PartnerRequest.deleteOne({
        $or: [
            { fromUser: userId, toUser: partnerId },
            { fromUser: partnerId, toUser: userId },
        ],
        status: 'accepted',
    });
    if (!deleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Partner request not found');
    }
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
