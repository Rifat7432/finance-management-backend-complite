import { z } from 'zod';

const createIncomeZodSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Income name is required' })
      .min(2, 'Name must be at least 2 characters long'),

    amount: z
      .number({ required_error: 'Amount is required' })
      .min(0, 'Amount must be a positive number'),

    receiveDate: z
      .string({ required_error: 'Receive date is required' }),

    frequency: z
      .string()
      .optional(),

  }),
});

const updateIncomeZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    amount: z.number().optional(),
    receiveDate: z.string().optional(),
    frequency: z.string().optional(),
  }),
});

export const IncomeValidation = {
  createIncomeZodSchema,
  updateIncomeZodSchema,
};
