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
exports.BudgetService = exports.getYearlyBudgetAnalyticsFromDB = exports.getUserBudgetsByTypeFromDB = void 0;
const http_status_codes_1 = require("http-status-codes");
const budget_model_1 = require("./budget.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const date_fns_1 = require("date-fns");
const createBudgetToDB = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const newBudget = yield budget_model_1.Budget.create(Object.assign(Object.assign({}, payload), { userId }));
    if (!newBudget) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create budget');
    }
    return newBudget;
});
const getUserBudgetsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const budgets = yield budget_model_1.Budget.find({ userId, isDeleted: false });
    if (!budgets.length) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No budgets found for this user');
    }
    return budgets;
});
// Get all budgets for a user by type (personal/household) in current month
const getUserBudgetsByTypeFromDB = (partnerId, userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const today = new Date();
    const monthStart = (0, date_fns_1.startOfMonth)(today);
    const monthEnd = (0, date_fns_1.endOfMonth)(today);
    const budgets = yield budget_model_1.Budget.find(Object.assign(Object.assign({ userId, isDeleted: false }, (query.type ? { type: query.type } : {})), { createdAt: {
            $gte: monthStart,
            $lte: monthEnd,
        } }));
    if (query.type === 'household' && partnerId) {
        const partnerBudgets = yield budget_model_1.Budget.find({
            userId: partnerId,
            isDeleted: false,
            type: 'household',
            createdAt: {
                $gte: monthStart,
                $lte: monthEnd,
            },
        });
        budgets.push(...partnerBudgets);
    }
    return budgets;
});
exports.getUserBudgetsByTypeFromDB = getUserBudgetsByTypeFromDB;
// Yearly budget analytics for a given user
const getYearlyBudgetAnalyticsFromDB = (userId, year) => __awaiter(void 0, void 0, void 0, function* () {
    const targetYear = year || new Date().getFullYear();
    const yearStart = (0, date_fns_1.startOfYear)(new Date(targetYear, 0, 1));
    const yearEnd = (0, date_fns_1.endOfYear)(new Date(targetYear, 0, 1));
    // Fetch all budgets created within the target year
    const budgets = yield budget_model_1.Budget.find({
        userId,
        isDeleted: false,
        createdAt: {
            $gte: yearStart,
            $lte: yearEnd,
        },
    })
        .select('amount createdAt')
        .lean();
    // Month names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Initialize totals
    const monthlyTotals = Array(12).fill(0);
    // Sum amounts
    budgets.forEach((budget) => {
        const monthIndex = new Date(budget.createdAt).getMonth();
        monthlyTotals[monthIndex] += budget.amount;
    });
    // Format output
    return monthNames.map((month, index) => ({
        month,
        totalBudget: monthlyTotals[index],
    }));
});
exports.getYearlyBudgetAnalyticsFromDB = getYearlyBudgetAnalyticsFromDB;
const updateBudgetToDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isBudgetExist = yield budget_model_1.Budget.findOne({ _id: id, isDeleted: false });
    if (!isBudgetExist) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Budget is already deleted or not found');
    }
    const updated = yield budget_model_1.Budget.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update budget');
    }
    return updated;
});
const deleteBudgetFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isBudgetExist = yield budget_model_1.Budget.findOne({ _id: id, isDeleted: false });
    if (!isBudgetExist) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Budget is already deleted or not found');
    }
    const deleted = yield budget_model_1.Budget.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!deleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Budget not found');
    }
    return true;
});
exports.BudgetService = {
    createBudgetToDB,
    getUserBudgetsFromDB,
    getUserBudgetsByTypeFromDB: exports.getUserBudgetsByTypeFromDB,
    getYearlyBudgetAnalyticsFromDB: exports.getYearlyBudgetAnalyticsFromDB,
    updateBudgetToDB,
    deleteBudgetFromDB,
};
