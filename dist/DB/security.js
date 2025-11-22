"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSecurity = setupSecurity;
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const app_1 = __importDefault(require("../app"));
// Setup security middleware
function setupSecurity() {
    // Apply compression middleware
    app_1.default.use((0, compression_1.default)());
    // Security headers
    app_1.default.use((0, helmet_1.default)());
    //   app.use(
    //     helmet({
    //       crossOriginResourcePolicy: false,
    //     }),
    //   );
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
    });
    // Apply rate limiting to all routes
    app_1.default.use(limiter);
    // Add request timeout
    app_1.default.use((req, res, next) => {
        res.setTimeout(30000, () => {
            res.status(503).send('Request timeout');
        });
        next();
    });
}
