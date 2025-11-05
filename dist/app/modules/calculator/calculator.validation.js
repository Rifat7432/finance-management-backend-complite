"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculatorValidation = void 0;
const zod_1 = require("zod");
const SavingCalculatorContentZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.number(),
        frequency: zod_1.z.enum(['Monthly', 'Yearly']),
        returnRate: zod_1.z.number(),
        years: zod_1.z.number(),
        inflationRate: zod_1.z.number(),
        taxRate: zod_1.z.number(),
    }),
});
const RepaymentCalculatorZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        principal: zod_1.z.number(),
        annualInterestRate: zod_1.z.number(),
        loanTermYears: zod_1.z.number(),
    }),
});
const HistoricalInflationCalculatorZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        fromYear: zod_1.z.number(),
        toYear: zod_1.z.number(),
        amount: zod_1.z.number(),
    }),
});
const InflationCalculatorZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        initialAmount: zod_1.z.number(),
        annualInflationRate: zod_1.z.number(),
        years: zod_1.z.number(),
    }),
});
exports.CalculatorValidation = {
    SavingCalculatorContentZodSchema,
    RepaymentCalculatorZodSchema,
    InflationCalculatorZodSchema,
    HistoricalInflationCalculatorZodSchema
};
