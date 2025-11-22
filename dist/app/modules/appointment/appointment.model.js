"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Appointment = void 0;
const mongoose_1 = require("mongoose");
const appointmentSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    attendant: { type: String, required: true },
    isChild: { type: Boolean, required: true },
    approxIncome: { type: Number, required: true },
    investment: { type: Number, required: true },
    discuss: { type: String },
    reachingFor: { type: String, required: true },
    ask: { type: String, required: true },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'complete'], default: 'pending' },
}, { timestamps: true });
exports.Appointment = (0, mongoose_1.model)('Appointment', appointmentSchema);
