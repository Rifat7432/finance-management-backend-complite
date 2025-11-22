"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetValidation = void 0;
const zod_1 = require("zod");
const createBudgetZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Name is required' }).min(2),
        amount: zod_1.z.number({ required_error: 'Amount is required' }).min(0),
        type: zod_1.z.enum(['personal', 'household'], { required_error: 'Type is required' }),
        category: zod_1.z.string({ required_error: 'Category is required' }),
    }),
});
const updateBudgetZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        amount: zod_1.z.number().optional(),
        type: zod_1.z.enum(['personal', 'household']).optional(),
        category: zod_1.z.string().optional(),
    }),
});
exports.BudgetValidation = {
    createBudgetZodSchema,
    updateBudgetZodSchema,
};
