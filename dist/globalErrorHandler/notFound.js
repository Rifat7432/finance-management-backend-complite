"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = void 0;
const http_status_codes_1 = require("http-status-codes");
const notFound = (req, res) => {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Not found',
        errorMessages: [
            {
                path: req === null || req === void 0 ? void 0 : req.originalUrl,
                message: "API DOESN'T EXIST",
            },
        ],
    });
};
exports.notFound = notFound;
