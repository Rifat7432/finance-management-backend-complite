"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateNightRouter = void 0;
const express_1 = __importDefault(require("express"));
const dateNight_controller_1 = require("./dateNight.controller");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const dateNight_validation_1 = require("./dateNight.validation");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enums/user");
const router = express_1.default.Router();
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.USER), (0, validateRequest_1.default)(dateNight_validation_1.DateNightValidation.createDateNightZodSchema), dateNight_controller_1.DateNightController.createDateNight);
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.USER), dateNight_controller_1.DateNightController.getDateNights);
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER), dateNight_controller_1.DateNightController.getSingleDateNight);
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER), (0, validateRequest_1.default)(dateNight_validation_1.DateNightValidation.updateDateNightZodSchema), dateNight_controller_1.DateNightController.updateDateNight);
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER), dateNight_controller_1.DateNightController.deleteDateNight);
exports.DateNightRouter = router;
