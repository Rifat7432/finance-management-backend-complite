import { z } from 'zod';

const createAppointmentZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2),
    email: z.string({ required_error: 'Email is required' }).email(),
    attendant: z.string({ required_error: 'Attendent is required' }),
    isChild: z.boolean({ required_error: 'isChild is required' }),
    approxIncome: z.number({ required_error: 'Approx income is required' }),
    investment: z.number({ required_error: 'Investment is required' }),
    discuss: z.string().optional(),
    reachingFor: z.string({ required_error: 'Reaching for is required' }),
    ask: z.string({ required_error: 'Ask is required' }),
    date: z.string({ required_error: 'Date is required' }),
    timeSlot: z.string({ required_error: 'Time slot is required' }),
  }),
});

const updateAppointmentZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    attendant: z.string().optional(),
    isChild: z.boolean().optional(),
    approxIncome: z.number().optional(),
    investment: z.number().optional(),
    discuss: z.string().optional(),
    reachingFor: z.string().optional(),
    ask: z.string().optional(),
    date: z.string().optional(),
    timeSlot: z.string().optional(),
  
  }),
});

export const AppointmentValidation = {
  createAppointmentZodSchema,
  updateAppointmentZodSchema,
};
