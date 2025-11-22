"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentValidation = void 0;
const zod_1 = require("zod");
const createContentZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string({ required_error: 'Title is required' }).min(2),
        duration: zod_1.z.string().optional(),
        videoUrl: zod_1.z.string({ required_error: 'Video URL is required' }),
        views: zod_1.z.number().optional(),
        category: zod_1.z.string(),
    }),
});
const updateContentZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        category: zod_1.z.string().optional(),
        title: zod_1.z.string().optional(),
        duration: zod_1.z.string().optional(),
        videoUrl: zod_1.z.string().optional(),
        views: zod_1.z.number().optional(),
    }),
});
const updateContentViewsZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        view: zod_1.z.number().optional(),
    }),
});
exports.ContentValidation = {
    createContentZodSchema,
    updateContentZodSchema,
    updateContentViewsZodSchema,
};
