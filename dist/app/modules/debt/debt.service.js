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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebtService = void 0;
const http_status_codes_1 = require("http-status-codes");
const debt_model_1 = require("./debt.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
// Create new debt
const createDebtToDB = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const newDebt = yield debt_model_1.Debt.create(Object.assign(Object.assign({}, payload), { userId }));
    if (!newDebt) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create debt');
    }
    return newDebt;
});
const getDebtInsightsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const debts = yield debt_model_1.Debt.find({ userId, isDeleted: false });
    if (!debts.length) {
        return {
            suggestedOrder: [],
            summary: {
                totalDebt: 0,
                avgInterestRate: 0,
                monthlyPayment: 0,
            },
        };
    }
    // Calculate interestRate on the fly
    const debtsWithRate = debts.map((d) => {
        const totalPayment = Number(d.capitalRepayment) + Number(d.interestRepayment);
        const interestRate = totalPayment > 0 ? (Number(d.interestRepayment) / totalPayment) * 100 : 0;
        return {
            name: d.name,
            amount: d.amount,
            monthlyPayment: Number(d.monthlyPayment),
            AdHocPayment: Number(d.AdHocPayment),
            capitalRepayment: Number(d.capitalRepayment),
            interestRepayment: Number(d.interestRepayment),
            interestRate: parseFloat(interestRate.toFixed(2)),
            payDueDate: d.payDueDate,
        };
    });
    // 1. Suggested Payment Order (top 3 by interestRate)
    const suggestedOrder = debtsWithRate
        .sort((a, b) => b.interestRate - a.interestRate)
        .slice(0, 3)
        .map((d) => ({ name: d.name, interestRate: d.interestRate }));
    // 2. Debt Summary
    const totalDebt = debtsWithRate.reduce((sum, d) => sum + d.amount, 0);
    const avgInterestRate = debtsWithRate.reduce((sum, d) => sum + d.interestRate, 0) / debtsWithRate.length;
    const monthlyPayment = debtsWithRate.reduce((sum, d) => sum + d.monthlyPayment, 0);
    return {
        suggestedOrder,
        summary: {
            totalDebt,
            avgInterestRate: parseFloat(avgInterestRate.toFixed(2)),
            monthlyPayment,
        },
        debts: debtsWithRate.sort((a, b) => b.interestRate - a.interestRate).slice(0, 3),
    };
});
// Get all debts for a user
const getUserDebtsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const debts = yield debt_model_1.Debt.find({ userId, isDeleted: false });
    if (!debts.length) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No debts found for this user');
    }
    return debts;
});
// Get a single debt
const getSingleDebtFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const debt = yield debt_model_1.Debt.findById(id);
    if (!debt || debt.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Debt not found or deleted');
    }
    return debt;
});
// Update debt
const updateDebtToDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const debt = yield debt_model_1.Debt.findById(id);
    if (!debt || debt.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Debt not found or deleted');
    }
    const updated = yield debt_model_1.Debt.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update debt');
    }
    return updated;
});
// Delete debt
const deleteDebtFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const debt = yield debt_model_1.Debt.findById(id);
    if (!debt || debt.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Debt not found or deleted already');
    }
    const deleted = yield debt_model_1.Debt.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!deleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Debt not found');
    }
    return true;
});
exports.DebtService = {
    createDebtToDB,
    getUserDebtsFromDB,
    getSingleDebtFromDB,
    updateDebtToDB,
    deleteDebtFromDB,
    getDebtInsightsFromDB,
};
