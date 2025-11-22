"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Debt = void 0;
const mongoose_1 = require("mongoose");
const debtSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    monthlyPayment: { type: Number, required: true },
    AdHocPayment: { type: Number, required: true },
    capitalRepayment: { type: Number, required: true },
    interestRepayment: { type: Number, required: true },
    payDueDate: { type: String, required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
exports.Debt = (0, mongoose_1.model)('Debt', debtSchema);
