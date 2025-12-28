"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateNightValidation = void 0;
const zod_1 = require("zod");
const createDateNightZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        plan: zod_1.z.string({ required_error: 'Plan is required' }).min(2),
        budget: zod_1.z.number({ required_error: 'Budget is required' }).min(0),
        repeatEvery: zod_1.z.enum(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']).default('Monthly'),
        date: zod_1.z.string().optional(),
        time: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
        endEmilNotification: zod_1.z.boolean().optional()
    }),
});
const updateDateNightZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        plan: zod_1.z.string().optional(),
        budget: zod_1.z.number().optional(),
        repeatEvery: zod_1.z.enum(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']).optional(),
        date: zod_1.z.string().optional(),
        time: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
    }),
});
exports.DateNightValidation = {
    createDateNightZodSchema,
    updateDateNightZodSchema,
};
