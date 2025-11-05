import { z } from 'zod';

const createDebtZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Debt name is required' }).min(2),
    amount: z.number({ required_error: 'Amount is required' }).min(0),
    monthlyPayment: z.number({ required_error: 'Monthly payment is required' }),
    AdHocPayment: z.number({ required_error: 'Ad-Hoc payment is required' }),
    capitalRepayment: z.number({ required_error: 'Capital repayment is required' }),
    interestRepayment: z.number({ required_error: 'Interest repayment is required' }),
    payDueDate: z.string({ required_error: 'Pay due date is required' }),
  }),
});

const updateDebtZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    amount: z.number().optional(),
    monthlyPayment: z.number().optional(),
    AdHocPayment: z.number().optional(),
    capitalRepayment: z.number().optional(),
    interestRepayment: z.number().optional(),
    payDueDate: z.string().optional(),
  }),
});

export const DebtValidation = {
  createDebtZodSchema,
  updateDebtZodSchema,
};
