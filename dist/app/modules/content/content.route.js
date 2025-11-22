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
exports.ContentRouter = void 0;
const express_1 = __importDefault(require("express"));
const content_controller_1 = require("./content.controller");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const content_validation_1 = require("./content.validation");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enums/user");
const fileUploadHandler_1 = __importDefault(require("../../middleware/fileUploadHandler"));
const moveImagesVideosToS3_1 = __importDefault(require("../../middleware/moveImagesVideosToS3"));
const router = express_1.default.Router();
// user content routes
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER), content_controller_1.ContentController.getContents);
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER), content_controller_1.ContentController.getSingleContent);
router.put('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER), (0, validateRequest_1.default)(content_validation_1.ContentValidation.updateContentZodSchema), content_controller_1.ContentController.updateContent);
// admin content routes
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), (0, fileUploadHandler_1.default)(), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // 🔹 Upload image/video files from local → S3
        const s3Uploads = yield (0, moveImagesVideosToS3_1.default)(req.files);
        const video = Array.isArray(s3Uploads.video) ? s3Uploads.video[0].url : (_a = s3Uploads.video) === null || _a === void 0 ? void 0 : _a.url;
        // merge request body
        const data = JSON.parse(req.body.data || '{}');
        req.body = video ? Object.assign({ videoUrl: video }, data) : Object.assign({}, data);
        next();
    }
    catch (error) {
        next(error);
    }
}), (0, validateRequest_1.default)(content_validation_1.ContentValidation.createContentZodSchema), content_controller_1.ContentController.createContent);
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), (0, fileUploadHandler_1.default)(), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // 🔹 Upload image/video files from local → S3
        const s3Uploads = yield (0, moveImagesVideosToS3_1.default)(req.files);
        const video = Array.isArray(s3Uploads.video) ? s3Uploads.video[0].url : (_a = s3Uploads.video) === null || _a === void 0 ? void 0 : _a.url;
        // merge request body
        const data = JSON.parse(req.body.data || '{}');
        req.body = video ? Object.assign({ videoUrl: video }, data) : Object.assign({}, data);
        next();
    }
    catch (error) {
        next(error);
    }
}), (0, validateRequest_1.default)(content_validation_1.ContentValidation.updateContentZodSchema), content_controller_1.ContentController.updateContent);
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), content_controller_1.ContentController.deleteContent);
exports.ContentRouter = router;
