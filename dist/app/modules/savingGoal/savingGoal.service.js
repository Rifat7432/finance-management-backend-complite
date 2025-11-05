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
const createSavingGoalToDB = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, totalAmount, monthlyTarget, date } = payload;
    const startDate = new Date(date);
    // Calculate months needed to complete the goal
    const monthsNeeded = Math.ceil(totalAmount / monthlyTarget);
    // Calculate complete date
    const completeDate = new Date(startDate);
    completeDate.setMonth(completeDate.getMonth() + monthsNeeded);
    // Save goal to database
    const savingGoal = yield savingGoal_model_1.SavingGoal.create({
        name,
        totalAmount,
        monthlyTarget,
        date: startDate.toISOString(),
        completeDate: completeDate.toISOString(),
        userId,
    });
    return savingGoal;
});
const getUserSavingGoalsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Get all goals for this user
    const goals = yield savingGoal_model_1.SavingGoal.find({ userId, isDeleted: false });
    const totalCompletion = goals.reduce((sum, goal) => sum + goal.completionRation, 0);
    const avgCompletion = totalCompletion / goals.length;
    return {
        avgCompletion,
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
    const updatedDate = payload.date ? new Date(payload.date) : new Date(currentGoal.date);
    if ('totalAmount' in payload || 'monthlyTarget' in payload || 'date' in payload) {
        const monthsNeeded = Math.ceil(updatedTotalAmount / updatedMonthlyTarget);
        const newCompleteDate = new Date(updatedDate);
        newCompleteDate.setMonth(newCompleteDate.getMonth() + monthsNeeded);
        payload.completeDate = newCompleteDate.toISOString();
        if (payload.date) {
            payload.date = updatedDate.toISOString();
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
