"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseValidation = void 0;
const zod_1 = require("zod");
const createExpenseZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Expense name is required' }).min(2),
        amount: zod_1.z.number({ required_error: 'Amount is required' }).min(0),
        endDate: zod_1.z.string({ required_error: 'End date is required' }), // Consider Date
        frequency: zod_1.z.string().optional(),
    }),
});
const updateExpenseZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        amount: zod_1.z.number().optional(),
        endDate: zod_1.z.string().optional(),
        frequency: zod_1.z.string().optional(),
    }),
});
exports.ExpenseValidation = {
    createExpenseZodSchema,
    updateExpenseZodSchema,
};
