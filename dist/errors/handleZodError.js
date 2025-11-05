"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handleZodError = (err) => {
    const errorSources = err.errors.map((error) => {
        return {
            path: error === null || error === void 0 ? void 0 : error.path[(error === null || error === void 0 ? void 0 : error.path.length) - 1],
            message: error === null || error === void 0 ? void 0 : error.message,
        };
    });
    return {
        statusCode: 400,
        message: 'Validation Error',
        errorSources,
    };
};
exports.default = handleZodError;
