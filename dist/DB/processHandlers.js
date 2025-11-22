"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupProcessHandlers = setupProcessHandlers;
const logger_1 = require("../shared/logger");
const shutdown_1 = require("./shutdown");
const colors_1 = __importDefault(require("colors"));
function setupProcessHandlers() {
    process.on('uncaughtException', (error) => {
        const errorMessage = error && typeof error.message === 'string' ? error.message : String(error);
        if (errorMessage.includes('critical')) {
            logger_1.logger.error(colors_1.default.red('Uncaught Exception critical'), errorMessage);
            (0, shutdown_1.gracefulShutdown)('uncaughtException');
        }
    });
    process.on('unhandledRejection', (reason, promise) => {
        const reasonMessage = reason instanceof Error ? reason.message : String(reason);
        if (reasonMessage.includes('critical')) {
            logger_1.logger.error(colors_1.default.red('Unhandled Rejection at critical'), promise, 'reason:', reasonMessage);
            (0, shutdown_1.gracefulShutdown)('unhandledRejection');
        }
    });
    // Signal handlers are fine as they are
    process.on('SIGINT', () => {
        (0, shutdown_1.gracefulShutdown)('SIGINT');
    });
    process.on('SIGTERM', () => {
        (0, shutdown_1.gracefulShutdown)('SIGTERM');
    });
    process.on('SIGUSR2', () => {
        (0, shutdown_1.gracefulShutdown)('SIGUSR2');
    });
}
