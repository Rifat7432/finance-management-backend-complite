"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdValidation = void 0;
const zod_1 = require("zod");
const createAdZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Name is required' }).min(2),
        startDate: zod_1.z.string({ required_error: 'Start date is required' }),
        endDate: zod_1.z.string({ required_error: 'End date is required' }),
        url: zod_1.z.string({ required_error: 'Video or Image is required' }),
    }),
});
const updateAdZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        url: zod_1.z.string().optional(),
    }),
});
exports.AdValidation = {
    createAdZodSchema,
    updateAdZodSchema,
};
