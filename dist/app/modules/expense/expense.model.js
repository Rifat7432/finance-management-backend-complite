"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Expense = void 0;
const mongoose_1 = require("mongoose");
// Schema
const expenseSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    endDate: { type: Date, required: true }, // consider Date type
    frequency: { type: String, enum: ['on-off', 'weekly', 'monthly', 'yearly'], default: 'on-off' }, // optional: enum like 'daily', 'monthly'
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
// Model
exports.Expense = (0, mongoose_1.model)('Expense', expenseSchema);
