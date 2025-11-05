"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerRequestValidation = void 0;
const zod_1 = require("zod");
const createPartnerRequestZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Name is required' }),
        email: zod_1.z.string({ required_error: 'Email is required' }).email(),
        relation: zod_1.z.string().optional(),
        status: zod_1.z.enum(['pending', 'accepted', 'rejected']).optional(),
    }),
});
exports.PartnerRequestValidation = {
    createPartnerRequestZodSchema,
};
