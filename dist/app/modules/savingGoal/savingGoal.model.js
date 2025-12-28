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
exports.SavingGoal = void 0;
const mongoose_1 = require("mongoose");
// Helper function for completion calculation
function calculateCompletion(savedMoney, totalAmount) {
    const completionRation = totalAmount > 0 ? Math.min((savedMoney / totalAmount) * 100, 100) : 0;
    const isCompleted = totalAmount > 0 && savedMoney >= totalAmount;
    return { completionRation, isCompleted };
}
const savingGoalSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    monthlyTarget: { type: Number, required: true },
    completionRation: { type: Number, default: 0 },
    savedMoney: { type: Number, default: 0 },
    date: { type: String, required: true },
    completeDate: { type: String, required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    isCompleted: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
// Handle .save()
savingGoalSchema.pre('save', function (next) {
    if (this.isModified('savedMoney') || this.isNew) {
        const { completionRation, isCompleted } = calculateCompletion(this.savedMoney, this.totalAmount);
        this.completionRation = completionRation;
        this.isCompleted = isCompleted;
    }
    next();
});
// Handle findOneAndUpdate
savingGoalSchema.pre('findOneAndUpdate', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const update = this.getUpdate();
        if (!update)
            return next();
        const docToUpdate = yield this.model.findOne(this.getQuery());
        if (!docToUpdate)
            return next();
        const savedMoney = (_a = update.savedMoney) !== null && _a !== void 0 ? _a : docToUpdate.savedMoney;
        const totalAmount = (_b = update.totalAmount) !== null && _b !== void 0 ? _b : docToUpdate.totalAmount;
        const { completionRation, isCompleted } = calculateCompletion(savedMoney, totalAmount);
        update.completionRation = completionRation;
        update.isCompleted = isCompleted;
        next();
    });
});
exports.SavingGoal = (0, mongoose_1.model)('SavingGoal', savingGoalSchema);
