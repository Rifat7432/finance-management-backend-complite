"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavingGoalValidation = void 0;
const zod_1 = require("zod");
const createSavingGoalZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Name is required' }).min(2),
        totalAmount: zod_1.z.number({ required_error: 'Total amount is required' }).min(0),
        monthlyTarget: zod_1.z.number({ required_error: 'Monthly target is required' }).min(0),
        date: zod_1.z.string({ required_error: 'Date is required' }),
    }),
});
const updateSavingGoalZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        totalAmount: zod_1.z.number().optional(),
        monthlyTarget: zod_1.z.number().optional(),
        date: zod_1.z.string().optional(),
    }),
});
exports.SavingGoalValidation = {
    createSavingGoalZodSchema,
    updateSavingGoalZodSchema,
};
