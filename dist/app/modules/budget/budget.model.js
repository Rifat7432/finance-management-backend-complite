"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Budget = void 0;
const mongoose_1 = require("mongoose");
const budgetSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['personal', 'household'], required: true },
    frequency: { type: String, enum: ['on-off', 'monthly',], default: 'monthly' },
    category: { type: String, required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    expensesId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Expense' },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
exports.Budget = (0, mongoose_1.model)('Budget', budgetSchema);
