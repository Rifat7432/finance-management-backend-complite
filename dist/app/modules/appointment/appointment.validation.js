"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentValidation = void 0;
const zod_1 = require("zod");
const createAppointmentZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Name is required' }).min(2),
        email: zod_1.z.string({ required_error: 'Email is required' }).email(),
        attendant: zod_1.z.string({ required_error: 'Attendent is required' }),
        isChild: zod_1.z.boolean({ required_error: 'isChild is required' }),
        approxIncome: zod_1.z.number({ required_error: 'Approx income is required' }),
        investment: zod_1.z.number({ required_error: 'Investment is required' }),
        discuss: zod_1.z.string().optional(),
        reachingFor: zod_1.z.string({ required_error: 'Reaching for is required' }),
        ask: zod_1.z.string({ required_error: 'Ask is required' }),
        date: zod_1.z.string({ required_error: 'Date is required' }),
        timeSlot: zod_1.z.string({ required_error: 'Time slot is required' }),
    }),
});
const updateAppointmentZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        attendant: zod_1.z.string().optional(),
        isChild: zod_1.z.boolean().optional(),
        approxIncome: zod_1.z.number().optional(),
        investment: zod_1.z.number().optional(),
        discuss: zod_1.z.string().optional(),
        reachingFor: zod_1.z.string().optional(),
        ask: zod_1.z.string().optional(),
        date: zod_1.z.string().optional(),
        timeSlot: zod_1.z.string().optional(),
    }),
});
exports.AppointmentValidation = {
    createAppointmentZodSchema,
    updateAppointmentZodSchema,
};
