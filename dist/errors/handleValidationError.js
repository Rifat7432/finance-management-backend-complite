"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handleValidationError = (err) => {
    const errorSources = Object.values(err.errors).map((ele) => {
        return {
            path: ele === null || ele === void 0 ? void 0 : ele.path,
            message: ele === null || ele === void 0 ? void 0 : ele.message,
        };
    });
    return {
        statusCode: 400,
        message: 'Validation Error',
        errorSources,
    };
};
exports.default = handleValidationError;
