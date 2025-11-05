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
exports.AnalyticsService = void 0;
const http_status_codes_1 = require("http-status-codes");
const user_model_1 = require("../user/user.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const income_model_1 = require("../income/income.model");
const date_fns_1 = require("date-fns");
const mongoose_1 = __importDefault(require("mongoose"));
const savingGoal_model_1 = require("../savingGoal/savingGoal.model");
const expense_model_1 = require("../expense/expense.model");
const appointment_model_1 = require("../appointment/appointment.model");
const dateNight_model_1 = require("../dateNight/dateNight.model");
// create user
const getAnalyticsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.isExistUserById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    const now = new Date();
    const start = (0, date_fns_1.startOfMonth)(now);
    const end = (0, date_fns_1.endOfMonth)(now);
    const result = yield income_model_1.Income.aggregate([
        {
            $match: {
                userId: new mongoose_1.default.Types.ObjectId(userId),
                createdAt: { $gte: start, $lte: end },
                isDeleted: false,
            },
        },
        {
            $group: {
                _id: null,
                totalIncome: { $sum: '$amount' },
            },
        },
        {
            $lookup: {
                from: 'expenses',
                let: { userId: new mongoose_1.default.Types.ObjectId(userId) },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [{ $eq: ['$userId', '$$userId'] }, { $gte: ['$createdAt', start] }, { $lte: ['$createdAt', end] }],
                            },
                            isDeleted: false,
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalExpenses: { $sum: '$amount' },
                        },
                    },
                ],
                as: 'expenseData',
            },
        },
        {
            $lookup: {
                from: 'budgets',
                let: { userId: new mongoose_1.default.Types.ObjectId(userId) },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [{ $eq: ['$userId', '$$userId'] }, { $gte: ['$createdAt', start] }, { $lte: ['$createdAt', end] }],
                            },
                            isDeleted: false,
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalBudget: { $sum: '$amount' },
                        },
                    },
                ],
                as: 'budgetData',
            },
        },
        {
            $lookup: {
                from: savingGoal_model_1.SavingGoal.collection.name,
                let: { userId: new mongoose_1.default.Types.ObjectId(userId) },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$userId', '$$userId'] },
                                    { $gte: ['$createdAt', start] },
                                    { $lte: ['$createdAt', end] },
                                    { $gt: [{ $toDate: '$completeDate' }, new Date()] }, // convert string to date here
                                ],
                            },
                            isDeleted: false,
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalMonthlyTarget: { $sum: '$monthlyTarget' },
                        },
                    },
                ],
                as: 'savingGoalData',
            },
        },
        {
            $addFields: {
                totalExpenses: {
                    $ifNull: [{ $arrayElemAt: ['$expenseData.totalExpenses', 0] }, 0],
                },
                budgetOnly: {
                    $ifNull: [{ $arrayElemAt: ['$budgetData.totalBudget', 0] }, 0],
                },
                savingGoalMonthly: {
                    $ifNull: [{ $arrayElemAt: ['$savingGoalData.totalMonthlyTarget', 0] }, 0],
                },
            },
        },
        {
            $addFields: {
                totalBudget: {
                    $add: [{ $ifNull: ['$budgetOnly', 0] }, { $ifNull: ['$savingGoalMonthly', 0] }],
                },
                disposal: {
                    $subtract: [{ $ifNull: ['$totalIncome', 0] }, { $ifNull: ['$totalExpenses', 0] }],
                },
            },
        },
        {
            $project: {
                _id: 0,
                totalIncome: 1,
                totalExpenses: 1,
                totalBudget: 1,
                disposal: 1,
            },
        },
    ]);
    const savingGoal = yield savingGoal_model_1.SavingGoal.aggregate([
        // 1️⃣ Filter user and remove deleted goals
        {
            $match: {
                userId: new mongoose_1.default.Types.ObjectId(userId),
                isDeleted: false,
            },
        },
        // 2️⃣ Group totals
        {
            $group: {
                _id: null,
                totalSavedMoney: { $sum: '$savedMoney' },
                totalGoalAmount: { $sum: '$totalAmount' },
                // Weighted sum of completion ratios
                weightedCompletionSum: {
                    $sum: {
                        $multiply: ['$completionRation', '$totalAmount'],
                    },
                },
            },
        },
        // 3️⃣ Calculate overall completion rate (weighted average)
        {
            $project: {
                _id: 0,
                totalSavedMoney: 1,
                savingGoalCompletionRate: {
                    $cond: [
                        { $eq: ['$totalGoalAmount', 0] },
                        0,
                        {
                            $divide: ['$weightedCompletionSum', '$totalGoalAmount'],
                        },
                    ],
                },
            },
        },
    ]);
    const { totalSavedMoney, savingGoalCompletionRate } = savingGoal[0];
    return { user, analytics: result.length > 0 ? result[0] : {}, savingGoalCompletionRate, totalSavedMoney };
});
const getLatestUpdateFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.isExistUserById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    const appointments = yield appointment_model_1.Appointment.find({ userId, isDeleted: false }).sort({ createdAt: -1 });
    const dateNights = yield dateNight_model_1.DateNight.find({ userId, isDeleted: false }).sort({ createdAt: -1 }).limit(2);
    const expenses = yield expense_model_1.Expense.find({ userId, isDeleted: false }).sort({ createdAt: -1 }).limit(2);
    console.log(appointments, dateNights, expenses);
    return {
        appointments,
        dateNights,
        expenses,
    };
});
exports.AnalyticsService = {
    getAnalyticsFromDB,
    getLatestUpdateFromDB,
};
