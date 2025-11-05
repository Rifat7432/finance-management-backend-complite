"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomeValidation = void 0;
const zod_1 = require("zod");
const createIncomeZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({ required_error: 'Income name is required' })
            .min(2, 'Name must be at least 2 characters long'),
        amount: zod_1.z
            .number({ required_error: 'Amount is required' })
            .min(0, 'Amount must be a positive number'),
        receiveDate: zod_1.z
            .string({ required_error: 'Receive date is required' }),
        frequency: zod_1.z
            .string()
            .optional(),
    }),
});
const updateIncomeZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        amount: zod_1.z.number().optional(),
        receiveDate: zod_1.z.string().optional(),
        frequency: zod_1.z.string().optional(),
    }),
});
exports.IncomeValidation = {
    createIncomeZodSchema,
    updateIncomeZodSchema,
};
