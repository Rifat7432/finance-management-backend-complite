"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculatorRouter = void 0;
const express_1 = __importDefault(require("express"));
const calculator_controller_1 = require("./calculator.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const calculator_validation_1 = require("./calculator.validation");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const router = express_1.default.Router();
router.post('/saving-calculator', (0, validateRequest_1.default)(calculator_validation_1.CalculatorValidation.SavingCalculatorContentZodSchema), (0, auth_1.default)(), calculator_controller_1.CalculatorController.getSavingCalculator);
router.post('/loan-repayment-calculator', (0, validateRequest_1.default)(calculator_validation_1.CalculatorValidation.RepaymentCalculatorZodSchema), (0, auth_1.default)(), calculator_controller_1.CalculatorController.getLoanRepaymentCalculator);
router.post('/inflation-calculator', (0, validateRequest_1.default)(calculator_validation_1.CalculatorValidation.InflationCalculatorZodSchema), (0, auth_1.default)(), calculator_controller_1.CalculatorController.getInflationCalculator);
router.post('/historical-inflation-calculator', (0, validateRequest_1.default)(calculator_validation_1.CalculatorValidation.HistoricalInflationCalculatorZodSchema), (0, auth_1.default)(), calculator_controller_1.CalculatorController.getHistoricalInflationCalculator);
exports.CalculatorRouter = router;
