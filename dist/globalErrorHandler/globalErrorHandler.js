"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const config_1 = __importDefault(require("../config"));
const zod_1 = require("zod");
const handleZodError_1 = __importDefault(require("../errors/handleZodError"));
const handleValidationError_1 = __importDefault(require("../errors/handleValidationError"));
const handleCastError_1 = __importDefault(require("../errors/handleCastError"));
const handleDuplicateError_1 = __importDefault(require("../errors/handleDuplicateError"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const http_status_codes_1 = require("http-status-codes");
const processError = (err) => {
    if (err instanceof zod_1.ZodError)
        return (0, handleZodError_1.default)(err);
    if ((err === null || err === void 0 ? void 0 : err.name) === 'validationError')
        return (0, handleValidationError_1.default)(err);
    if ((err === null || err === void 0 ? void 0 : err.name) === 'CastError')
        return (0, handleCastError_1.default)(err);
    if ((err === null || err === void 0 ? void 0 : err.code) === 11000)
        return (0, handleDuplicateError_1.default)(err);
    if (err instanceof AppError_1.default) {
        return {
            statusCode: err === null || err === void 0 ? void 0 : err.statusCode,
            message: err === null || err === void 0 ? void 0 : err.message,
            errorSources: (err === null || err === void 0 ? void 0 : err.message) ? [{ path: '', message: err === null || err === void 0 ? void 0 : err.message }] : [],
        };
    }
    if (err.name === 'TokenExpiredError') {
        return {
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            message: 'Session Expired',
            errorSources: (err === null || err === void 0 ? void 0 : err.message)
                ? [
                    {
                        path: '',
                        message: 'Your session has expired. Please log in again to continue.',
                    },
                ]
                : [],
        };
    }
    if (err instanceof Error) {
        return {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            message: err === null || err === void 0 ? void 0 : err.message,
            errorSources: err.message ? [{ path: '', message: err === null || err === void 0 ? void 0 : err.message }] : [],
        };
    }
    return {
        statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
        message: 'Something went wrong!',
        errorSources: [],
    };
};
const globalErrorHandler = (error, req, res, _next) => {
    // Process the all error function
    const { statusCode, message, errorSources } = processError(error);
    // Respond with a consistent error structure
    res.status(statusCode).json({
        success: false,
        message,
        statusCode,
        error: errorSources,
        stack: config_1.default.node_env === 'development' ? error === null || error === void 0 ? void 0 : error.stack : undefined,
    });
};
exports.globalErrorHandler = globalErrorHandler;
exports.default = exports.globalErrorHandler;
