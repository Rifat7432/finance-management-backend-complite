import mongoose, { Model } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';
export type IUser = {
     name: string;
     role: USER_ROLES;
     email: string;
     password: string;
     phone?: string;
     image?: string;
     isDeleted: boolean;
     subscriptionId: string;
     status: 'active' | 'blocked';
     verified: boolean;
     socialId?: string;
     authProvider?: 'google' | 'apple' | "local";
     partnerId?: mongoose.Types.ObjectId;
     authentication?: {
          isResetPassword: boolean;
          oneTimeCode: number;
          expireAt: Date;
     };
     notifications?: {};
};
export interface UserSubscriptionDTO {
  image: string;
  Name: string;
  Email: string;
  Subscriptions: string;
  StartDate: string | null;
  EndDate: string | null;
  PhoneNumber: string;
}



export type UserModel = {
     isExistUserById(id: string): any;
     isExistUserByEmail(email: string): any;
     isExistUserByPhone(contact: string): any;
     isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;
