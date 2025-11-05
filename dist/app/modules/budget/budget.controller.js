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
exports.BudgetController = exports.getYearlyBudgetAnalytics = exports.getUserBudgetsByType = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const budget_service_1 = require("./budget.service");
const createBudget = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield budget_service_1.BudgetService.createBudgetToDB(req.body, userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        message: 'Budget created successfully',
        data: result,
    });
}));
const getUserBudgets = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield budget_service_1.BudgetService.getUserBudgetsFromDB(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Budgets retrieved successfully',
        data: result,
    });
}));
exports.getUserBudgetsByType = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield budget_service_1.BudgetService.getUserBudgetsByTypeFromDB(user.partnerId, user.id, req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Budgets retrieved successfully',
        data: result,
    });
}));
// Get yearly budget analytics
exports.getYearlyBudgetAnalytics = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
    const result = yield budget_service_1.BudgetService.getYearlyBudgetAnalyticsFromDB(user.id, year);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Budget analytics retrieved successfully',
        data: result,
    });
}));
const updateBudget = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield budget_service_1.BudgetService.updateBudgetToDB(id, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Budget updated successfully',
        data: result,
    });
}));
const deleteBudget = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield budget_service_1.BudgetService.deleteBudgetFromDB(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Budget deleted successfully',
    });
}));
exports.BudgetController = {
    createBudget,
    getUserBudgets,
    getUserBudgetsByType: exports.getUserBudgetsByType,
    getYearlyBudgetAnalytics: exports.getYearlyBudgetAnalytics,
    updateBudget,
    deleteBudget,
};
