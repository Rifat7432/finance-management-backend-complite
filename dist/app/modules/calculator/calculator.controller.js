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
exports.CalculatorController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const calculator_service_1 = require("./calculator.service");
// Get Calculator results
const getSavingCalculator = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body; // Assumes Zod validation runs before this
    const data = yield calculator_service_1.CalculatorService.getSavingCalculatorFromDB(payload);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Calculator results retrieved successfully',
        data: data,
    });
}));
// Get Calculator results
const getLoanRepaymentCalculator = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body; // Assumes Zod validation runs before this
    const data = yield calculator_service_1.CalculatorService.loanRepaymentCalculatorFromDB(payload);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Calculator results retrieved successfully',
        data: data,
    });
}));
// Get Calculator results
const getInflationCalculator = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body; // Assumes Zod validation runs before this
    const data = yield calculator_service_1.CalculatorService.inflationCalculatorFromDB(payload);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Calculator results retrieved successfully',
        data: data,
    });
}));
// Get Calculator results
const getHistoricalInflationCalculator = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body; // Assumes Zod validation runs before this
    const data = yield calculator_service_1.CalculatorService.inflationCalculatorFromAPI(payload);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Calculator results retrieved successfully',
        data: data,
    });
}));
exports.CalculatorController = {
    getSavingCalculator,
    getLoanRepaymentCalculator,
    getInflationCalculator,
    getHistoricalInflationCalculator
};
