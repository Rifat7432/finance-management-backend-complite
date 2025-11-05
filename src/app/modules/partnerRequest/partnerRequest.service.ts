import { StatusCodes } from 'http-status-codes';
import { IPartnerRequest } from './partnerRequest.interface';
import AppError from '../../../errors/AppError';
import { PartnerRequest } from './partnerRequest.model';
import { User } from '../user/user.model';
import { emailTemplate } from '../../../shared/emailTemplate';
import { emailHelper } from '../../../helpers/emailHelper';
import { USER_ROLES } from '../../../enums/user';

const createPartnerRequestToDB = async (inviterId: string, partnerData: { name: string; email: string; relation: string }) => {
     const inviter = await User.findById(inviterId);
     if (!inviter) throw new AppError(StatusCodes.NOT_FOUND, 'Inviter not found');
     if (inviter.partnerId) {
          throw new AppError(StatusCodes.CONFLICT, 'You are already partnered with someone');
     }
     // Check if partner user already exists
     const existingUser = await User.findOne({ email: partnerData.email });

     if (existingUser) {
                    const isRequestExist = await PartnerRequest.findOne({
               $or: [
                    { fromUser: inviterId, toUser: existingUser._id },
                    { fromUser: existingUser._id, toUser: inviterId },
               ],
          });
          if (isRequestExist) {
               throw new AppError(StatusCodes.CONFLICT, 'A partner request already exists between you and this user');
          }
          // Check if already partners
          if (existingUser.partnerId?.toString() === inviterId) {
               throw new AppError(StatusCodes.CONFLICT, 'Already partners with this user');
          }

          // If the partner is registered but not yet linked with another user, create a partner request
          if (!existingUser.partnerId) {
               // Create Partner Request
               const request = await PartnerRequest.create({
                    fromUser: inviterId,
                    toUser: existingUser._id,
                    email: partnerData.email,
                    relation: partnerData.relation,
               });

               // Send email notification to the partner about the request
               const emailContent = emailTemplate.partnerRequest({
                    name: existingUser.name,
                    email: existingUser.email,
                    inviterName: inviter.name,
                    relation: partnerData.relation,
                    requestId: request._id as string,
               });
               await emailHelper.sendEmail(emailContent);

               return request;
          } else {
               // If the partner is already linked with another user, throw an error
               throw new AppError(StatusCodes.CONFLICT, 'This user is already partnered with someone else');
          }
     } else {
          // Partner is not registered, create a new user with default password
          const defaultPassword = '12345678'; // 8 chars random password

          const newPartner = await User.create({
               name: partnerData.name,
               email: partnerData.email,
               password: defaultPassword,
               role: USER_ROLES.USER,
          });
          await PartnerRequest.create({
               fromUser: inviterId,
               toUser: newPartner._id,
               email: partnerData.email,
               relation: partnerData.relation,
          });
          // Send email to the partner with the login details
          const emailContent = emailTemplate.partnerInvite({
               name: partnerData.name,
               inviterName: inviter.name,
               email: partnerData.email,
               password: defaultPassword,
          });
          await emailHelper.sendEmail(emailContent);

          return newPartner;
     }
};

// Function to accept partner request
const acceptPartnerRequestToDB = async (requestId: string, partnerId: string) => {
     // Fetch the partner request from the database
     const partnerRequest = await PartnerRequest.findById(requestId);
     if (!partnerRequest) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Partner request not found');
     }

     // Ensure that the partner is the one accepting the request
     if (!partnerRequest.toUser || partnerRequest.toUser.toString() !== partnerId) {
          throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized to accept this request');
     }

     // Fetch the inviter and the partner (the one accepting the request)
     const inviter = await User.findById(partnerRequest.fromUser);
     const partner = await User.findById(partnerId);

     if (!inviter || !partner) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User(s) not found');
     }
     if (partner.partnerId) {
          throw new AppError(StatusCodes.NOT_FOUND, 'You are already partnered with someone');
     }
     if (inviter.partnerId) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Partner are already partnered with someone');
     }

     // Link the partner to the inviter (set partnerId)
     inviter.partnerId = partner._id;
     partner.partnerId = inviter._id;

     // Save both inviter and partner with the updated partnerId
     await inviter.save();
     await partner.save();

     // Update the partner request status to 'accepted'
     partnerRequest.status = 'accepted';
     await partnerRequest.save();

     // Optionally, you could send a confirmation email to both users
     // Send emails to both inviter and partner confirming the partnership.

     return {
          inviter,
          partner,
          message: 'Partner request accepted and users are now linked.',
     };
};

const getPartnerRequestsFromDB = async (userId: string) => {
     const requests = await PartnerRequest.find({
          $or: [{ fromUser: userId }, { toUser: userId }],
     }).populate('fromUser', 'name email image').populate('toUser', 'name email image');

     return requests;
};

const getSinglePartnerRequestFromDB = async (id: string): Promise<IPartnerRequest | null> => {
     const request = await PartnerRequest.findById(id);
     if (!request) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Partner request not found');
     }
     return request;
};

const UnlinkWithPartnerRequestToDB = async (partnerId: string, userId: string) => {
     const user = await User.findById(userId);
     const partner = await User.findById(partnerId);
     if (!user || !partner) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User(s) not found');
     }
     if (user.partnerId?.toString() !== partnerId || partner.partnerId?.toString() !== userId) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Users are not linked as partners');
     }
     user.partnerId = undefined;
     partner.partnerId = undefined;
     const updated = await user.save();
     await partner.save();
     return updated;
};

const deletePartnerRequestFromDB = async (id: string): Promise<boolean> => {
     const partnerRequest = await PartnerRequest.findById(id);
     const fromUser = await User.findById(partnerRequest?.fromUser);
     const toUser = await User.findById(partnerRequest?.toUser);
     if (fromUser?.partnerId?.toString() === partnerRequest?.toUser || toUser?.partnerId?.toString() === partnerRequest?.fromUser) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Cannot delete an active partner request between linked users');
     }
     const deleted = await PartnerRequest.findByIdAndDelete(id);
     if (!deleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Partner request not found');
     }
     return true;
};

export const PartnerRequestService = {
     createPartnerRequestToDB,
     getPartnerRequestsFromDB,
     getSinglePartnerRequestFromDB,
     UnlinkWithPartnerRequestToDB,
     deletePartnerRequestFromDB,
     acceptPartnerRequestToDB,
};
