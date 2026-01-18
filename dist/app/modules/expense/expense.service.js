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
exports.ExpenseService = void 0;
const http_status_codes_1 = require("http-status-codes");
const expense_model_1 = require("./expense.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const date_fns_1 = require("date-fns");
const dateTimeHelper_1 = require("../../../utils/dateTimeHelper");
const budget_model_1 = require("../budget/budget.model");
// Create new expense
const createExpenseToDB = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { endDate, category, type } = payload, rest = __rest(payload, ["endDate", "category", "type"]);
    const utcEndDate = (0, dateTimeHelper_1.toUTC)(endDate);
    const newExpense = yield expense_model_1.Expense.create(Object.assign(Object.assign({}, rest), { endDate: utcEndDate, userId }));
    if (!newExpense) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create expense');
    }
    if (category && type) {
        const budget = yield budget_model_1.Budget.create(Object.assign({ userId, expensesId: newExpense._id, category,
            type, amount: payload.amount, name: payload.name }, (payload.frequency === 'on-off' ? { frequency: payload.frequency } : {})));
        if (budget) {
            const updatedExpense = yield expense_model_1.Expense.findByIdAndUpdate(newExpense._id, { budgetId: budget._id }, { new: true });
            return updatedExpense;
        }
    }
    return newExpense;
});
// Get all expenses for a user
const getUserExpensesFromDB = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const weekStart = (0, date_fns_1.startOfWeek)((0, dateTimeHelper_1.getCurrentUTC)());
    const weekEnd = (0, date_fns_1.endOfWeek)((0, dateTimeHelper_1.getCurrentUTC)());
    const monthStart = (0, dateTimeHelper_1.getStartOfMonthUTC)();
    const monthEnd = (0, dateTimeHelper_1.getEndOfMonthUTC)();
    const yearStart = (0, dateTimeHelper_1.getStartOfYearUTC)();
    const yearEnd = (0, dateTimeHelper_1.getEndOfYearUTC)();
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
        : {}))).populate('budgetId', 'type category');
    return expenses;
});
// Get all expenses for a user by frequency
const getUserExpensesByFrequencyFromDB = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const monthStart = (0, dateTimeHelper_1.getStartOfMonthUTC)();
    const monthEnd = (0, dateTimeHelper_1.getEndOfMonthUTC)();
    const expenses = yield expense_model_1.Expense.find(Object.assign(Object.assign({ userId, isDeleted: false }, (query.frequency ? { frequency: query.frequency } : {})), { endDate: {
            // CHANGED FROM createdAt
            $gte: monthStart,
            $lte: monthEnd,
        } }));
    return expenses;
});
// WHY CHANGED: Already uses endDate - NO CHANGE NEEDED ✅
const getYearlyExpenseAnalyticsFromDB = (userId, year) => __awaiter(void 0, void 0, void 0, function* () {
    const targetYear = year || (0, dateTimeHelper_1.getCurrentUTC)().getFullYear();
    const yearStart = (0, dateTimeHelper_1.getStartOfYearUTC)(new Date(targetYear, 0, 1));
    const yearEnd = (0, dateTimeHelper_1.getEndOfYearUTC)(new Date(targetYear, 0, 1));
    const expenses = yield expense_model_1.Expense.find({
        userId: userId,
        isDeleted: false,
        endDate: {
            // Already correct ✅
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
    // const { endDate, category, type, ...rest } = payload;
    if (payload === null || payload === void 0 ? void 0 : payload.endDate) {
        payload.endDate = (0, dateTimeHelper_1.toUTC)(payload.endDate);
    }
    const updated = yield expense_model_1.Expense.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update expense');
    }
    if (payload.category && payload.type && payload.amount && payload.category && payload.frequency) {
        yield budget_model_1.Budget.findOneAndUpdate({ expensesId: isExpenseExist._id }, Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (payload.category ? { category: payload.category } : {})), (payload.type ? { type: payload.type } : {})), (payload.amount ? { amount: payload.amount } : {})), (payload.name ? { name: payload.name } : {})), (payload.frequency === 'on-off' ? { frequency: payload.frequency } : {})), { new: true });
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
    if (isExpenseExist.budgetId && deleted.isDeleted) {
        yield budget_model_1.Budget.findOneAndUpdate({ expensesId: isExpenseExist._id }, { isDeleted: true }, { new: true });
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
