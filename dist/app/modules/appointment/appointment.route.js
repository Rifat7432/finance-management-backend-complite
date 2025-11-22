"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentRouter = void 0;
const express_1 = __importDefault(require("express"));
const appointment_controller_1 = require("./appointment.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enums/user");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const appointment_validation_1 = require("./appointment.validation");
const router = express_1.default.Router();
// user routes for appointments
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.USER), (0, validateRequest_1.default)(appointment_validation_1.AppointmentValidation.createAppointmentZodSchema), appointment_controller_1.AppointmentController.createAppointment);
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.USER), appointment_controller_1.AppointmentController.getUserAppointments);
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER), (0, validateRequest_1.default)(appointment_validation_1.AppointmentValidation.updateAppointmentZodSchema), appointment_controller_1.AppointmentController.updateAppointment);
// admin routs for appointments
router.get('/all/appointment', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), appointment_controller_1.AppointmentController.getAllAppointments);
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN), appointment_controller_1.AppointmentController.getSingleAppointment);
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN), appointment_controller_1.AppointmentController.deleteAppointment);
exports.AppointmentRouter = router;
