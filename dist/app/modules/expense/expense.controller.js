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
exports.ExpenseController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const expense_service_1 = require("./expense.service");
// Create expense
const createExpense = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield expense_service_1.ExpenseService.createExpenseToDB(req.body, userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Expense added successfully',
        data: result,
    });
}));
// Get all user expenses
const getUserExpenses = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield expense_service_1.ExpenseService.getUserExpensesFromDB(user.id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Expenses retrieved successfully',
        data: result,
    });
}));
// Get all user expenses by frequency
const getUserExpensesByFrequency = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield expense_service_1.ExpenseService.getUserExpensesByFrequencyFromDB(user.id, req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Expenses retrieved successfully',
        data: result,
    });
}));
// Get yearly expense analytics
const getYearlyExpenseAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
    const result = yield expense_service_1.ExpenseService.getYearlyExpenseAnalyticsFromDB(user.id, year);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Expenses retrieved successfully',
        data: result,
    });
}));
// Get single expense
const getSingleExpense = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield expense_service_1.ExpenseService.getSingleExpenseFromDB(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Expense retrieved successfully',
        data: result,
    });
}));
// Update expense
const updateExpense = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield expense_service_1.ExpenseService.updateExpenseToDB(id, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Expense updated successfully',
        data: result,
    });
}));
// Delete expense
const deleteExpense = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield expense_service_1.ExpenseService.deleteExpenseFromDB(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Expense deleted successfully',
        data: result,
    });
}));
exports.ExpenseController = {
    createExpense,
    getUserExpenses,
    getUserExpensesByFrequency,
    getYearlyExpenseAnalytics,
    getSingleExpense,
    updateExpense,
    deleteExpense,
};
