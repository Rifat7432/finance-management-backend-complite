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
exports.ExpenseService = void 0;
const http_status_codes_1 = require("http-status-codes");
const expense_model_1 = require("./expense.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const date_fns_1 = require("date-fns");
// Create new expense
const createExpenseToDB = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const newExpense = yield expense_model_1.Expense.create(Object.assign(Object.assign({}, payload), { userId }));
    if (!newExpense) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create expense');
    }
    return newExpense;
});
// Get all expenses for a user
const getUserExpensesFromDB = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const weekStart = (0, date_fns_1.startOfWeek)(new Date());
    const weekEnd = (0, date_fns_1.endOfWeek)(new Date());
    const monthStart = (0, date_fns_1.startOfMonth)(new Date());
    const monthEnd = (0, date_fns_1.endOfMonth)(new Date());
    const yearStart = (0, date_fns_1.startOfYear)(new Date());
    const yearEnd = (0, date_fns_1.endOfYear)(new Date());
    const expenses = yield expense_model_1.Expense.find(Object.assign({ isDeleted: false, userId }, (query.frequency
        ? query.frequency === 'weekly'
            ? {
                endDate: {
                    // CHANGED FROM createdAt
                    $gte: weekStart,
                    $lte: weekEnd,
                },
            }
            : query.frequency === 'monthly'
                ? {
                    endDate: {
                        // CHANGED FROM createdAt
                        $gte: monthStart,
                        $lte: monthEnd,
                    },
                }
                : query.frequency === 'yearly'
                    ? {
                        endDate: {
                            // CHANGED FROM createdAt
                            $gte: yearStart,
                            $lte: yearEnd,
                        },
                    }
                    : { frequency: query.frequency }
        : {})));
    return expenses;
});
// Get all expenses for a user by frequency
const getUserExpensesByFrequencyFromDB = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const monthStart = (0, date_fns_1.startOfMonth)(new Date());
    const monthEnd = (0, date_fns_1.endOfMonth)(new Date());
    const expenses = yield expense_model_1.Expense.find(Object.assign(Object.assign({ userId, isDeleted: false }, (query.frequency ? { frequency: query.frequency } : {})), { endDate: {
            $gte: monthStart,
            $lte: monthEnd,
        } }));
    return expenses;
});
// WHY CHANGED: Already uses endDate - NO CHANGE NEEDED ✅
const getYearlyExpenseAnalyticsFromDB = (userId, year) => __awaiter(void 0, void 0, void 0, function* () {
    const targetYear = year || new Date().getFullYear();
    const yearStart = (0, date_fns_1.startOfYear)(new Date(targetYear, 0, 1));
    const yearEnd = (0, date_fns_1.endOfYear)(new Date(targetYear, 0, 1));
    const expenses = yield expense_model_1.Expense.find({
        userId: userId,
        isDeleted: false,
        endDate: {
            $gte: yearStart.toISOString(),
            $lte: yearEnd.toISOString(),
        },
    }).lean();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTotals = Array(12).fill(0);
    expenses.forEach((expense) => {
        const monthIndex = new Date(expense.endDate).getMonth();
        monthlyTotals[monthIndex] += expense.amount;
    });
    return monthNames.map((month, index) => ({
        month,
        totalExpenses: monthlyTotals[index],
    }));
});
// Get a single expense
const getSingleExpenseFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const expense = yield expense_model_1.Expense.findById(id);
    if (!expense) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Expense not found');
    }
    if (expense.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Expense Deleted');
    }
    return expense;
});
// Update expense
const updateExpenseToDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isExpenseExist = yield expense_model_1.Expense.findOne({ _id: id, isDeleted: false });
    if (!isExpenseExist) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Expense not found');
    }
    const updated = yield expense_model_1.Expense.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update expense');
    }
    return updated;
});
// Delete expense
const deleteExpenseFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isExpenseExist = yield expense_model_1.Expense.findOne({ _id: id, isDeleted: false });
    if (!isExpenseExist) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Expense not found');
    }
    const deleted = yield expense_model_1.Expense.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!deleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Expense not found');
    }
    return true;
});
exports.ExpenseService = {
    createExpenseToDB,
    getUserExpensesFromDB,
    getUserExpensesByFrequencyFromDB,
    getYearlyExpenseAnalyticsFromDB,
    getSingleExpenseFromDB,
    updateExpenseToDB,
    deleteExpenseFromDB,
};
