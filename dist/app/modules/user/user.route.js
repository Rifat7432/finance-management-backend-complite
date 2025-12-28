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
exports.UserRouter = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const user_controller_1 = require("./user.controller");
const user_validation_1 = require("./user.validation");
const auth_1 = __importDefault(require("../../middleware/auth"));
const fileUploadHandler_1 = __importDefault(require("../../middleware/fileUploadHandler"));
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const moveImagesVideosToS3_1 = __importDefault(require("../../middleware/moveImagesVideosToS3"));
const router = express_1.default.Router();
// admin routes
router.route('/').get((0, auth_1.default)(user_1.USER_ROLES.ADMIN), user_controller_1.UserController.getAllUsers);
router.route('/block/:id').delete((0, auth_1.default)(user_1.USER_ROLES.ADMIN), user_controller_1.UserController.blockUser);
// user and admin routes
router
    .route('/profile')
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER), user_controller_1.UserController.getUserProfile)
    .patch((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER), (0, fileUploadHandler_1.default)(), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // 🔹 Upload image/video files from local → S3
        const s3Uploads = yield (0, moveImagesVideosToS3_1.default)(req.files);
        // pick S3 URL (single or first item if multiple)
        const image = Array.isArray(s3Uploads.image) ? s3Uploads.image[0].url : (_a = s3Uploads.image) === null || _a === void 0 ? void 0 : _a.url;
        // merge request body
        const data = JSON.parse(((_b = req.body) === null || _b === void 0 ? void 0 : _b.data) || '{}');
        req.body = image ? Object.assign({ image }, data) : Object.assign({}, data);
        next();
    }
    catch (error) {
        next(error);
    }
}), (0, validateRequest_1.default)(user_validation_1.UserValidation.updateUserZodSchema), user_controller_1.UserController.updateProfile);
// user routes
router.route('/').post((req, res, next) => {
    console.log(req.body);
    next();
}, (0, validateRequest_1.default)(user_validation_1.UserValidation.createUserZodSchema), user_controller_1.UserController.createUser);
router.post('/google', (0, validateRequest_1.default)(user_validation_1.UserValidation.googleAuthZodSchema), user_controller_1.UserController.createUserByGoogle);
router.post('/apple', (0, validateRequest_1.default)(user_validation_1.UserValidation.appleAuthZodSchema), user_controller_1.UserController.createUserByApple);
router.delete('/delete', (0, auth_1.default)(user_1.USER_ROLES.USER), user_controller_1.UserController.deleteProfile);
router.route('/user/:id').get((0, auth_1.default)(user_1.USER_ROLES.USER), user_controller_1.UserController.getUser);
exports.UserRouter = router;
