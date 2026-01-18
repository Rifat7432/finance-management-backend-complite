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
exports.BudgetService = exports.getUserBudgetsByTypeFromDB = void 0;
const http_status_codes_1 = require("http-status-codes");
const budget_model_1 = require("./budget.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const user_model_1 = require("../user/user.model");
const dateTimeHelper_1 = require("../../../utils/dateTimeHelper");
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
    const userInfo = yield user_model_1.User.findById(userId);
    if (!userInfo) {
        throw new AppError_1.default(404, 'User not found');
    }
    const today = (0, dateTimeHelper_1.getCurrentUTC)();
    const monthStart = (0, dateTimeHelper_1.getStartOfMonthUTC)(today);
    const monthEnd = (0, dateTimeHelper_1.getEndOfMonthUTC)(today);
    const allBudgets = [];
    const budgets = yield budget_model_1.Budget.find(Object.assign(Object.assign({ userId, isDeleted: false }, (query.type ? { type: query.type } : {})), { createdAt: {
            $gte: monthStart,
            $lte: monthEnd,
        } }));
    const addTaggedUserBudgets = budgets.map((budget) => (Object.assign(Object.assign({}, budget.toObject()), { taggedPartner: false })));
    allBudgets.push(...addTaggedUserBudgets);
    if (query.type === 'household' && userInfo.partnerId) {
        const partnerBudgets = yield budget_model_1.Budget.find({
            userId: userInfo.partnerId,
            isDeleted: false,
            type: 'household',
            createdAt: {
                $gte: monthStart,
                $lte: monthEnd,
            },
        });
        const addTaggedPartnerBudgets = partnerBudgets.map((budget) => (Object.assign(Object.assign({}, budget.toObject()), { taggedPartner: true })));
        allBudgets.push(...addTaggedPartnerBudgets);
    }
    const partnerInfo = yield user_model_1.User.findById(userInfo.partnerId).select('name email image isDeleted status');
    return { budgetData: allBudgets, partnerInfo };
});
exports.getUserBudgetsByTypeFromDB = getUserBudgetsByTypeFromDB;
// Yearly budget analytics for a given user
const getYearlyBudgetAnalyticsFromDB = (userId, year) => __awaiter(void 0, void 0, void 0, function* () {
    const targetYear = year || (0, dateTimeHelper_1.getCurrentUTC)().getFullYear();
    const yearStart = (0, dateTimeHelper_1.getStartOfYearUTC)(new Date(targetYear, 0, 1));
    const yearEnd = (0, dateTimeHelper_1.getEndOfYearUTC)(new Date(targetYear, 0, 1));
    const budgets = yield budget_model_1.Budget.find({
        userId,
        isDeleted: false,
        createdAt: {
            $gte: yearStart,
            $lte: yearEnd,
        },
    })
        .select('amount category createdAt')
        .lean();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Initialize monthly structure
    const monthlyData = Array.from({ length: 12 }, () => ({
        totalBudget: 0,
        essential: 0,
        discretionary: 0,
        savings: 0,
    }));
    budgets.forEach((budget) => {
        const monthIndex = new Date(budget.createdAt).getMonth();
        const amount = budget.amount;
        monthlyData[monthIndex].totalBudget += amount;
        switch (budget.category) {
            case 'Essential(Needs)':
                monthlyData[monthIndex].essential += amount;
                break;
            case 'Discretionary(Wants)':
                monthlyData[monthIndex].discretionary += amount;
                break;
            case 'Savings':
                monthlyData[monthIndex].savings += amount;
                break;
        }
    });
    return monthNames.map((month, index) => ({
        month,
        totalBudget: monthlyData[index].totalBudget,
        essential: monthlyData[index].essential,
        discresonary: monthlyData[index].discretionary, // keeping your spelling
        savings: monthlyData[index].savings,
    }));
});
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
    getYearlyBudgetAnalyticsFromDB,
    updateBudgetToDB,
    deleteBudgetFromDB,
};
