import { z } from 'zod';

const createDateNightZodSchema = z.object({
  body: z.object({
    plan: z.string({ required_error: 'Plan is required' }).min(2),
    budget: z.number({ required_error: 'Budget is required' }).min(0),
    repeatEvery: z.enum(['Daily', 'Weekly', 'Monthly', 'Yearly']).default('Monthly'),
    date: z.string().optional(),
    time: z.string().optional(),
    location: z.string().optional(),
  }),
});

const updateDateNightZodSchema = z.object({
  body: z.object({
    plan: z.string().optional(),
    budget: z.number().optional(),
    repeatEvery: z.enum(['Daily', 'Weekly', 'Monthly', 'Yearly']).optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    location: z.string().optional(),
  }),
});

export const DateNightValidation = {
  createDateNightZodSchema,
  updateDateNightZodSchema,
};
