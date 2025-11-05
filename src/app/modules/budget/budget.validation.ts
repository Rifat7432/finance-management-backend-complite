import { z } from 'zod';

const createBudgetZodSchema = z.object({
     body: z.object({
          name: z.string({ required_error: 'Name is required' }).min(2),
          amount: z.number({ required_error: 'Amount is required' }).min(0),
          type: z.enum(['personal', 'household'], { required_error: 'Type is required' }),
          category: z.string({ required_error: 'Category is required' }),
     }),
});

const updateBudgetZodSchema = z.object({
     body: z.object({
          name: z.string().optional(),
          amount: z.number().optional(),
          type: z.enum(['personal', 'household']).optional(),
          category: z.string().optional(),
     }),
});

export const BudgetValidation = {
     createBudgetZodSchema,
     updateBudgetZodSchema,
};
