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
exports.SavingGoalService = void 0;
const http_status_codes_1 = require("http-status-codes");
const savingGoal_model_1 = require("./savingGoal.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const mongoose_1 = __importDefault(require("mongoose"));
const dateTimeHelper_1 = require("../../../utils/dateTimeHelper");
const createSavingGoalToDB = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, totalAmount, monthlyTarget, date, savedMoney } = payload;
    const startDate = (0, dateTimeHelper_1.toUTC)(date);
    // Calculate months needed to complete the goal
    const monthsNeeded = Math.ceil((totalAmount - savedMoney) / monthlyTarget);
    // Calculate complete date
    const completeDate = (0, dateTimeHelper_1.toUTC)(startDate);
    completeDate.setMonth(completeDate.getMonth() + monthsNeeded);
    // Save goal to database
    const savingGoal = yield savingGoal_model_1.SavingGoal.create({
        name,
        totalAmount,
        monthlyTarget,
        date: startDate,
        completeDate: completeDate,
        userId,
        savedMoney,
    });
    return savingGoal;
});
const getUserSavingGoalsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    // Get all goals for this user
    const goals = yield savingGoal_model_1.SavingGoal.find({ userId, isDeleted: false });
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
    return {
        savingGoalCompletionRate: ((_a = savingGoal[0]) === null || _a === void 0 ? void 0 : _a.savingGoalCompletionRate) ? (_b = savingGoal[0]) === null || _b === void 0 ? void 0 : _b.savingGoalCompletionRate : 0,
        totalSavedMoney: ((_c = savingGoal[0]) === null || _c === void 0 ? void 0 : _c.totalSavedMoney) ? (_d = savingGoal[0]) === null || _d === void 0 ? void 0 : _d.totalSavedMoney : 0,
        goals,
    };
});
const getSingleSavingGoalFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const goal = yield savingGoal_model_1.SavingGoal.findById(id);
    if (!goal) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Saving goal not found');
    }
    return goal;
});
const updateSavingGoalToDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const currentGoal = yield savingGoal_model_1.SavingGoal.findById(id);
    if (!currentGoal) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Saving goal not found');
    }
    if (currentGoal.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Saving goal is deleted');
    }
    const updatedTotalAmount = (_a = payload.totalAmount) !== null && _a !== void 0 ? _a : currentGoal.totalAmount;
    const updatedMonthlyTarget = (_b = payload.monthlyTarget) !== null && _b !== void 0 ? _b : currentGoal.monthlyTarget;
    const updatedDate = payload.date ? (0, dateTimeHelper_1.toUTC)(payload.date) : (0, dateTimeHelper_1.toUTC)(currentGoal.date);
    if ('totalAmount' in payload || 'monthlyTarget' in payload || 'date' in payload) {
        const monthsNeeded = Math.ceil(updatedTotalAmount / updatedMonthlyTarget);
        const newCompleteDate = (0, dateTimeHelper_1.toUTC)(updatedDate);
        newCompleteDate.setMonth(newCompleteDate.getMonth() + monthsNeeded);
        payload.completeDate = newCompleteDate;
        if (payload.date) {
            payload.date = updatedDate;
        }
    }
    const updated = yield savingGoal_model_1.SavingGoal.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update saving goal');
    }
    return updated;
});
const deleteSavingGoalFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const goal = yield savingGoal_model_1.SavingGoal.findOne({ _id: id, isDeleted: false });
    if (!goal || goal.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Saving goal is already deleted or not found');
    }
    const deleted = yield savingGoal_model_1.SavingGoal.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!deleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Saving goal not found');
    }
    return true;
});
exports.SavingGoalService = {
    createSavingGoalToDB,
    getUserSavingGoalsFromDB,
    getSingleSavingGoalFromDB,
    updateSavingGoalToDB,
    deleteSavingGoalFromDB,
};
