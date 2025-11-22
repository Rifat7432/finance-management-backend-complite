"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidation = exports.createUserZodSchema = void 0;
const zod_1 = require("zod");
exports.createUserZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Name is required' }).min(2, 'Name must be at least 2 characters long'),
        email: zod_1.z.string({ required_error: 'Email is required' }).email('Invalid email address'),
        password: zod_1.z.string({ required_error: 'Password is required' }).min(8, 'Password must be at least 8 characters long'),
        phone: (0, zod_1.string)().default(''),
        image: zod_1.z.string().optional(),
    }),
});
const updateUserZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().email('Invalid email address').optional(),
        image: zod_1.z.string().optional(),
    }),
});
const googleAuthZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string({ required_error: 'Email is required' }).email('Invalid email address'),
        googleId: zod_1.z.string({ required_error: 'googleId is required' }),
        name: zod_1.z.string({ required_error: 'Name is required' }),
        email_verified: zod_1.z.boolean(),
        picture: zod_1.z.string().optional(),
        deviceToken: zod_1.z.string().optional(),
    }),
});
const appleAuthZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string({ required_error: 'Email is required' }).email('Invalid email address'),
        appleId: zod_1.z.string({ required_error: 'appleId is required' }),
        fullName: zod_1.z.object({
            givenName: zod_1.z.string({ required_error: 'Name is required' }),
            familyName: zod_1.z.string({ required_error: 'Name is required' }),
        }),
        deviceToken: zod_1.z.string().optional(),
    }),
});
exports.UserValidation = {
    createUserZodSchema: exports.createUserZodSchema,
    updateUserZodSchema,
    googleAuthZodSchema,
    appleAuthZodSchema,
};
