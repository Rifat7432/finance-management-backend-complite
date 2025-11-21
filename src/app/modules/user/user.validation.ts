import { string, z } from 'zod';

export const createUserZodSchema = z.object({
     body: z.object({
          name: z.string({ required_error: 'Name is required' }).min(2, 'Name must be at least 2 characters long'),
          email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
          password: z.string({ required_error: 'Password is required' }).min(8, 'Password must be at least 8 characters long'),
          phone: string().default(''),
          image: z.string().optional(),
     }),
});

const updateUserZodSchema = z.object({
     body: z.object({
          name: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().email('Invalid email address').optional(),
          image: z.string().optional(),
     }),
});
const googleAuthZodSchema = z.object({
     body: z.object({
          email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
          googleId: z.string({ required_error: 'googleId is required' }),
          name: z.string({ required_error: 'Name is required' }),
          email_verified: z.boolean(),
          picture: z.string().optional(),
          deviceToken: z.string().optional(),
     }),
});
const appleAuthZodSchema = z.object({
     body: z.object({
          email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
          appleId: z.string({ required_error: 'appleId is required' }),
          fullName: z.object({
               givenName: z.string({ required_error: 'Name is required' }),
               familyName: z.string({ required_error: 'Name is required' }),
          }),
          deviceToken: z.string().optional(),
     }),
});

export const UserValidation = {
     createUserZodSchema,
     updateUserZodSchema,
     googleAuthZodSchema,
     appleAuthZodSchema,
};
