"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Income = void 0;
const mongoose_1 = require("mongoose");
const incomeSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    receiveDate: { type: Date, required: true }, // consider Date if storing real date
    frequency: { type: String, enum: ['on-off', 'monthly', 'yearly'], default: 'on-off' }, // e.g., 'once', 'weekly', 'monthly'
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
// Export model
exports.Income = (0, mongoose_1.model)('Income', incomeSchema);
