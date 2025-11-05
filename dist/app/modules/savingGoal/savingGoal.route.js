"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavingGoalRouter = void 0;
const express_1 = __importDefault(require("express"));
const savingGoal_controller_1 = require("./savingGoal.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enums/user");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const savingGoal_validation_1 = require("./savingGoal.validation");
const router = express_1.default.Router();
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.USER), (0, validateRequest_1.default)(savingGoal_validation_1.SavingGoalValidation.createSavingGoalZodSchema), savingGoal_controller_1.SavingGoalController.createSavingGoal);
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.USER), savingGoal_controller_1.SavingGoalController.getUserSavingGoals);
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER), savingGoal_controller_1.SavingGoalController.getSingleSavingGoal);
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER), (0, validateRequest_1.default)(savingGoal_validation_1.SavingGoalValidation.updateSavingGoalZodSchema), savingGoal_controller_1.SavingGoalController.updateSavingGoal);
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER), savingGoal_controller_1.SavingGoalController.deleteSavingGoal);
exports.SavingGoalRouter = router;
