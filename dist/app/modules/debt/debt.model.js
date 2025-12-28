"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    completionRatio: { type: Number, default: 0 }
}, { timestamps: true });
debtSchema.pre('findOneAndUpdate', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const update = this.getUpdate();
        // fetch existing document
        const doc = yield this.model.findOne(this.getQuery());
        if (!doc)
            return next();
        const capitalRepayment = (_a = update.capitalRepayment) !== null && _a !== void 0 ? _a : doc.capitalRepayment;
        const interestRepayment = (_b = update.interestRepayment) !== null && _b !== void 0 ? _b : doc.interestRepayment;
        const AdHocPayment = (_c = update.AdHocPayment) !== null && _c !== void 0 ? _c : doc.AdHocPayment;
        const amount = (_d = update.amount) !== null && _d !== void 0 ? _d : doc.amount;
        const totalPaid = capitalRepayment +
            interestRepayment +
            AdHocPayment;
        update.completionRatio = Math.min((totalPaid / amount) * 100, 100);
        next();
    });
});
exports.Debt = (0, mongoose_1.model)('Debt', debtSchema);
