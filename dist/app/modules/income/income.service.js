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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomeService = void 0;
const http_status_codes_1 = require("http-status-codes");
const income_model_1 = require("./income.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const dateTimeHelper_1 = require("../../../utils/dateTimeHelper");
// Create new income
const createIncomeToDB = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { receiveDate } = payload, rest = __rest(payload, ["receiveDate"]);
    const utcReceiveDate = (0, dateTimeHelper_1.toUTC)(receiveDate);
    const newIncome = yield income_model_1.Income.create(Object.assign(Object.assign({}, rest), { receiveDate: utcReceiveDate, userId }));
    if (!newIncome) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create income');
    }
    return newIncome;
});
// Get incomes by user
const getUserIncomesFromDB = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const monthStart = (0, dateTimeHelper_1.getStartOfMonthUTC)();
    const yearStart = (0, dateTimeHelper_1.getStartOfYearUTC)();
    const monthEnd = (0, dateTimeHelper_1.getEndOfMonthUTC)();
    const yearEnd = (0, dateTimeHelper_1.getEndOfYearUTC)();
    const incomes = yield income_model_1.Income.find(Object.assign({ isDeleted: false, userId }, (query.frequency
        ? query.frequency === 'monthly'
            ? {
                receiveDate: {
                    // CHANGED FROM createdAt
                    $gte: monthStart,
                    $lte: monthEnd,
                },
            }
            : query.frequency === 'yearly'
                ? {
                    receiveDate: {
                        // CHANGED FROM createdAt
                        $gte: yearStart,
                        $lte: yearEnd,
                    },
                }
                : { frequency: query.frequency }
        : {})));
    return incomes;
});
// Get incomes by user  by frequency
const getUserIncomesByFrequencyFromDB = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const monthStart = (0, dateTimeHelper_1.getStartOfMonthUTC)();
    const monthEnd = (0, dateTimeHelper_1.getEndOfMonthUTC)();
    const incomes = yield income_model_1.Income.find(Object.assign(Object.assign({ isDeleted: false, userId }, (query.frequency ? { frequency: query.frequency } : {})), { receiveDate: {
            // CHANGED FROM createdAt
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
