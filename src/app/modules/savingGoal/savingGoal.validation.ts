import { z } from 'zod';

const createSavingGoalZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2),
    totalAmount: z.number({ required_error: 'Total amount is required' }).min(0),
    monthlyTarget: z.number({ required_error: 'Monthly target is required' }).min(0),
    date: z.string({ required_error: 'Date is required' }),
  }),
});

const updateSavingGoalZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    totalAmount: z.number().optional(),
    monthlyTarget: z.number().optional(),
    date: z.string().optional(),
  }),
});

export const SavingGoalValidation = {
  createSavingGoalZodSchema,
  updateSavingGoalZodSchema,
};
