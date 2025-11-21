import { z } from 'zod';


const createPartnerRequestZodSchema = z.object({
     body: z.object({
          name: z.string({ required_error: 'Name is required' }),
          email: z.string({ required_error: 'Email is required' }).email(),
          relation: z.string().optional(),
          status: z.enum(['pending', 'accepted', 'rejected']).optional(),
     }),
});
export const PartnerRequestValidation = {
     createPartnerRequestZodSchema,
};
