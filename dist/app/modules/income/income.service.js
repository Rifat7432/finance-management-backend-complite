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
exports.IncomeService = void 0;
const http_status_codes_1 = require("http-status-codes");
const income_model_1 = require("./income.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const date_fns_1 = require("date-fns");
// Create new income
const createIncomeToDB = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const newIncome = yield income_model_1.Income.create(Object.assign(Object.assign({}, payload), { userId }));
    if (!newIncome) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create income');
    }
    return newIncome;
});
// Get incomes by user
const getUserIncomesFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const incomes = yield income_model_1.Income.find({ userId, isDeleted: false });
    return incomes;
});
// Get incomes by user  by frequency
const getUserIncomesByFrequencyFromDB = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const monthStart = (0, date_fns_1.startOfMonth)(new Date());
    const monthEnd = (0, date_fns_1.endOfMonth)(new Date());
    const incomes = yield income_model_1.Income.find(Object.assign(Object.assign({ isDeleted: false, userId }, (query.frequency ? { frequency: query.frequency } : {})), { receiveDate: {
            $gte: monthStart,
            $lte: monthEnd,
        } }));
    return incomes;
});
// Get single income by ID
const getSingleIncomeFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const income = yield income_model_1.Income.findById(id);
    if (!income) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Income not found');
    }
    if (income.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Income Deleted');
    }
    return income;
});
// Update income by ID
const updateIncomeToDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isIncomeExist = yield income_model_1.Income.findOne({ _id: id, isDeleted: false });
    if (!isIncomeExist) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Income not found');
    }
    const updated = yield income_model_1.Income.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update income');
    }
    return updated;
});
// Delete income (soft delete)
const deleteIncomeFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isIncomeExist = yield income_model_1.Income.findOne({ _id: id, isDeleted: false });
    if (!isIncomeExist) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Income is already deleted or not found');
    }
    const deleted = yield income_model_1.Income.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!deleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Income not found');
    }
    return true;
});
exports.IncomeService = {
    createIncomeToDB,
    getUserIncomesFromDB,
    getUserIncomesByFrequencyFromDB,
    getSingleIncomeFromDB,
    updateIncomeToDB,
    deleteIncomeFromDB,
};
