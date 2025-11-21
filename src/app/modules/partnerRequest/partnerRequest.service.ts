import { StatusCodes } from 'http-status-codes';
import { IPartnerRequest } from './partnerRequest.interface';
import AppError from '../../../errors/AppError';
import { PartnerRequest } from './partnerRequest.model';
import { User } from '../user/user.model';
import { emailTemplate } from '../../../shared/emailTemplate';
import { emailHelper } from '../../../helpers/emailHelper';
import { USER_ROLES } from '../../../enums/user';
import mongoose from 'mongoose';

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
     // Fetch the partner request
     const partnerRequest = await PartnerRequest.findById(requestId);
     if (!partnerRequest) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Partner request not found');
     }

     // Ensure the correct user is accepting
     if (!partnerRequest.toUser || partnerRequest.toUser.toString() !== partnerId) {
          throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized to accept this request');
     }

     const inviter = await User.findById(partnerRequest.fromUser);
     const partner = await User.findById(partnerId);

     if (!inviter || !partner) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User(s) not found');
     }

     if (partner.partnerId) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'You are already partnered with someone');
     }

     if (inviter.partnerId) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Inviter is already partnered with someone');
     }

     // Link users
     await User.findByIdAndUpdate(inviter._id, { partnerId: partner._id });
     await User.findByIdAndUpdate(partner._id, { partnerId: inviter._id });

     // Update this request as accepted
     partnerRequest.status = 'accepted';
     await partnerRequest.save();

     // DELETE all other partner requests involving either user EXCEPT THIS ONE
     await PartnerRequest.deleteMany({
          _id: { $ne: requestId }, // skip the accepted one
          $or: [{ fromUser: inviter._id }, { toUser: inviter._id }, { fromUser: partner._id }, { toUser: partner._id }],
     });

     return {
          inviter,
          partner,
          message: 'Partner request accepted, users linked, and all other requests removed.',
     };
};

const getPartnerRequestsFromDB = async (userId: string) => {
     // Fetch the user first (to check partnerId)
     const user = await User.findById(userId);

     if (!user) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }

     // If user already has a partner, return their accepted partner request
     if (user.partnerId) {
          const partnerId = user.partnerId.toString();

          const acceptedRequest = await PartnerRequest.findOne({
               $or: [
                    { fromUser: userId, toUser: partnerId },
                    { fromUser: partnerId, toUser: userId },
               ],
               status: 'accepted',
          });
          const partnerInfo = await User.findById(user.partnerId).select('name email image');
          return {
               incoming: [],
               outgoing: [],
               partnerRequest: acceptedRequest || null,
               partnerInfo,
          };
     }

     // If no partnerId → return pending requests
     const userObjectId = new mongoose.Types.ObjectId(userId);

     const partnerRequests = await PartnerRequest.aggregate([
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
     return { ...(partnerRequests.length > 0 ? partnerRequests[0] : { incoming: [], outgoing: [] }), partnerRequests: null };
};

const getSinglePartnerRequestFromDB = async (id: string): Promise<IPartnerRequest | null> => {
     const request = await PartnerRequest.findById(id);
     if (!request) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Partner request not found');
     }
     return request;
};
const UnlinkWithPartnerRequestToDB = async (
     partnerRequestId: string,
     userId: string,
     // optional, not required
) => {
     // Get user
     const user = await User.findById(userId);

     if (!user) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }

     // user must already have a partner
     if (!user.partnerId) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'You do not have a partner');
     }

     // partnerId comes from the user document
     const partnerId = user.partnerId.toString();

     // get partner
     const partner = await User.findById(partnerId);

     if (!partner) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Partner not found');
     }

     // Find the accepted partner request between these two users
     const request = await PartnerRequest.findById(partnerRequestId);

     if (!request || request.status !== 'accepted') {
          throw new AppError(StatusCodes.NOT_FOUND, 'Accepted partner request between these users not found');
     }

     // Unlink both users
     await User.findByIdAndUpdate(userId, { partnerId: null });
     await User.findByIdAndUpdate(partnerId, { partnerId: null });

     // Delete the partner request
     await PartnerRequest.findByIdAndDelete(request._id);

     return true;
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
