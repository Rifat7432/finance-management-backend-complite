"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateNight = void 0;
const mongoose_1 = require("mongoose");
const dateNightSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: {
        type: String,
        required: true,
        trim: true,
    },
    budget: {
        type: Number,
        required: true,
        min: 0,
    },
    repeatEvery: {
        type: String,
        enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
        default: 'Monthly',
    },
    date: {
        type: Date,
    },
    time: {
        type: String, // could also be Date if storing full datetime
    },
    location: {
        type: String,
        trim: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
exports.DateNight = (0, mongoose_1.model)('DateNight', dateNightSchema);
