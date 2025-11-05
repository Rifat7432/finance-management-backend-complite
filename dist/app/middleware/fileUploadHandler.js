"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errors/AppError"));
// 🔹 Multer storage for temp staging
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        if (['image', 'video'].includes(file.fieldname)) {
            const tempDir = path_1.default.join(process.cwd(), 'uploads', 'temp');
            if (!fs_1.default.existsSync(tempDir))
                fs_1.default.mkdirSync(tempDir, { recursive: true });
            cb(null, tempDir);
        }
        else {
            const otherDir = path_1.default.join(process.cwd(), 'uploads', file.fieldname || 'others');
            if (!fs_1.default.existsSync(otherDir))
                fs_1.default.mkdirSync(otherDir, { recursive: true });
            cb(null, otherDir);
        }
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const name = file.originalname.replace(ext, '').toLowerCase().split(' ').join('-') +
            '-' +
            Date.now();
        cb(null, name + ext);
    },
});
// 🔹 File filter
const filterFilter = (req, file, cb) => {
    const imageTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/svg', 'image/webp', 'image/svg+xml'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/mpeg'];
    if (file.fieldname === 'image') {
        if (imageTypes.includes(file.mimetype))
            cb(null, true);
        else
            cb(new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid image format'));
    }
    else if (file.fieldname === 'video') {
        if (videoTypes.includes(file.mimetype))
            cb(null, true);
        else
            cb(new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid video format'));
    }
    else {
        cb(null, true); // allow other fields
    }
};
// 🔹 Export multer upload handler
const fileUploadHandler = () => (0, multer_1.default)({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: filterFilter,
}).fields([
    { name: 'image', maxCount: 10 },
    { name: 'video', maxCount: 5 },
    { name: 'thumbnail', maxCount: 5 },
    { name: 'logo', maxCount: 5 },
    { name: 'banner', maxCount: 5 },
    { name: 'audio', maxCount: 5 },
    { name: 'document', maxCount: 10 },
    { name: 'driverLicense', maxCount: 1 },
    { name: 'insurance', maxCount: 1 },
    { name: 'permits', maxCount: 1 },
]);
// 🔹 Move only images/videos → S3
exports.default = fileUploadHandler;
