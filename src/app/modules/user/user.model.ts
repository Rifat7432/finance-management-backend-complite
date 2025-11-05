import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { model, Schema } from 'mongoose';
import config from '../../../config';
import { USER_ROLES } from '../../../enums/user';
import AppError from '../../../errors/AppError';
import { IUser, UserModel } from './user.interface';

const userSchema = new Schema<IUser, UserModel>(
     {
          name: {
               type: String,
               required: true,
          },
          role: {
               type: String,
               enum: Object.values(USER_ROLES),
               default: USER_ROLES.USER,
          },
          email: {
               type: String,
               required: true,
               unique: true,
               lowercase: true,
          },
          password: {
               type: String,
               required: true,
               select: false,
               minlength: 8,
          },
          phone: {
               type: String,
               default: '',
          },
          image: {
               type: String,
               default: '',
          },
          status: {
               type: String,
               enum: ['active', 'blocked'],
               default: 'active',
          },
          verified: {
               type: Boolean,
               default: false,
          },
          isDeleted: {
               type: Boolean,
               default: false,
          },
          subscriptionId: {
               type: String,
               default: '',
          },
          socialId: {
               type: String,
               default: '', // Stores either Apple or Google ID
          },
          authProvider: {
               type: String,
               enum: ['google', 'apple', 'local'],
               default: 'local', // Specifies whether the ID is from Google or Apple
          },
          partnerId: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               default: null,
          },
          authentication: {
               type: {
                    isResetPassword: {
                         type: Boolean,
                         default: false,
                    },
                    oneTimeCode: {
                         type: Number,
                         default: null,
                    },
                    expireAt: {
                         type: Date,
                         default: null,
                    },
               },
               select: false,
          },
     },
     { timestamps: true },
);

// Exist User Check
userSchema.statics.isExistUserById = async (id: string) => {
     return await User.findById(id);
};

// db.users.updateOne({email:"tihow91361@linxues.com"},{email:"rakibhassan305@gmail.com"})

userSchema.statics.isExistUserByEmail = async (email: string) => {
     return await User.findOne({ email, isDeleted: false });
};
userSchema.statics.isExistUserByPhone = async (phone: string) => {
     return await User.findOne({ phone, isDeleted: false });
};
// Password Matching
userSchema.statics.isMatchPassword = async (password: string, hashPassword: string): Promise<boolean> => {
     return await bcrypt.compare(password, hashPassword);
};

// Pre-Save Hook for Hashing Password & Checking Email Uniqueness
userSchema.pre('save', async function (next) {
     const isExist = await User.findOne({ email: this.get('email') });
     if (isExist) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Email already exists!');
     }

     this.password = await bcrypt.hash(this.password, Number(config.bcrypt_salt_rounds));
     next();
});

// Query Middleware
userSchema.pre('find', function (next) {
     this.find({ isDeleted: { $ne: true } });
     next();
});

userSchema.pre('findOne', function (next) {
     this.find({ isDeleted: { $ne: true } });
     next();
});

userSchema.pre('aggregate', function (next) {
     this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
     next();
});
export const User = model<IUser, UserModel>('User', userSchema);
