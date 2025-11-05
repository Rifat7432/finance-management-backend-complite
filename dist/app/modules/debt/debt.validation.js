"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebtValidation = void 0;
const zod_1 = require("zod");
const createDebtZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Debt name is required' }).min(2),
        amount: zod_1.z.number({ required_error: 'Amount is required' }).min(0),
        monthlyPayment: zod_1.z.number({ required_error: 'Monthly payment is required' }),
        AdHocPayment: zod_1.z.number({ required_error: 'Ad-Hoc payment is required' }),
        capitalRepayment: zod_1.z.number({ required_error: 'Capital repayment is required' }),
        interestRepayment: zod_1.z.number({ required_error: 'Interest repayment is required' }),
        payDueDate: zod_1.z.string({ required_error: 'Pay due date is required' }),
    }),
});
const updateDebtZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        amount: zod_1.z.number().optional(),
        monthlyPayment: zod_1.z.number().optional(),
        AdHocPayment: zod_1.z.number().optional(),
        capitalRepayment: zod_1.z.number().optional(),
        interestRepayment: zod_1.z.number().optional(),
        payDueDate: zod_1.z.string().optional(),
    }),
});
exports.DebtValidation = {
    createDebtZodSchema,
    updateDebtZodSchema,
};
