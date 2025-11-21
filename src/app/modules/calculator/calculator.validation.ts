import { z } from 'zod';

const SavingCalculatorContentZodSchema = z.object({
     body: z.object({
          amount: z.number(),
          frequency: z.enum(['Monthly', 'Yearly']),
          returnRate: z.number(),
          years: z.number(),
          inflationRate: z.number(),
          taxRate: z.number(),
     }),
});

const RepaymentCalculatorZodSchema = z.object({
     body: z.object({
          principal: z.number(),
          annualInterestRate: z.number(),
          loanTermYears: z.number(),
     }),
});
const HistoricalInflationCalculatorZodSchema = z.object({
     body: z.object({
          fromYear: z.number(),
          toYear: z.number(),
          amount: z.number(),
     }),
});
const InflationCalculatorZodSchema = z.object({
     body: z.object({
          initialAmount: z.number(),
          annualInflationRate: z.number(),
          years: z.number(),
     }),
});

export const CalculatorValidation = {
        SavingCalculatorContentZodSchema,
        RepaymentCalculatorZodSchema,
        InflationCalculatorZodSchema,
        HistoricalInflationCalculatorZodSchema
};
