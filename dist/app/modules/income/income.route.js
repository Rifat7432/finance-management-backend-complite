"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomeRouter = void 0;
const express_1 = __importDefault(require("express"));
const income_controller_1 = require("./income.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enums/user");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const income_validation_1 = require("./income.validation");
// optional if using Zod/Joi
const router = express_1.default.Router();
// Create new income
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.USER), (0, validateRequest_1.default)(income_validation_1.IncomeValidation.createIncomeZodSchema), // Optional if using Zod
income_controller_1.IncomeController.createIncome);
// Get all incomes for logged-in user
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.USER), income_controller_1.IncomeController.getUserIncomes);
// Get all incomes for logged-in user by frequency
router.get('/frequency', (0, auth_1.default)(user_1.USER_ROLES.USER), income_controller_1.IncomeController.getUserIncomesByFrequency);
// Get a single income
router.get('/income/:id', (0, auth_1.default)(user_1.USER_ROLES.USER), income_controller_1.IncomeController.getSingleIncome);
// Update income
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER), (0, validateRequest_1.default)(income_validation_1.IncomeValidation.updateIncomeZodSchema), // Optional
income_controller_1.IncomeController.updateIncome);
// Delete income
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER), income_controller_1.IncomeController.deleteIncome);
exports.IncomeRouter = router;
