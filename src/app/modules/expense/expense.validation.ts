import { z } from 'zod';

const createExpenseZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Expense name is required' }).min(2),
    amount: z.number({ required_error: 'Amount is required' }).min(0),
    endDate: z.string({ required_error: 'End date is required' }), // Consider Date
    frequency: z.string().optional(),
  }),
});

const updateExpenseZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    amount: z.number().optional(),
    endDate: z.string().optional(),
    frequency: z.string().optional(),
  }),
});

export const ExpenseValidation = {
  createExpenseZodSchema,
  updateExpenseZodSchema,
};
