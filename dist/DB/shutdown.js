"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulShutdown = gracefulShutdown;
const mongoose_1 = __importDefault(require("mongoose"));
const colors_1 = __importDefault(require("colors"));
const logger_1 = require("../shared/logger");
const server_1 = require("../server");
const SHUTDOWN_TIMEOUT_MS = 30000;
function gracefulShutdown(signal) {
    if (global.isShuttingDown)
        return;
    global.isShuttingDown = true;
    logger_1.logger.info(colors_1.default.blue(`${signal} received. Shutting down gracefully...`));
    // Stop accepting new connections first
    if (server_1.httpServer) {
        server_1.httpServer.close(() => {
            logger_1.logger.info(colors_1.default.green('HTTP server closed successfully'));
        });
    }
    // Close socket server if exists
    if (server_1.socketServer) {
        server_1.socketServer.close(() => {
            logger_1.logger.info(colors_1.default.green('Socket.io server closed successfully'));
        });
    }
    // Close database connection
    if (mongoose_1.default.connection.readyState !== 0) {
        mongoose_1.default.connection
            .close(true)
            .then(() => {
            logger_1.logger.info(colors_1.default.green('Database connection closed gracefully'));
            process.exit(0);
        })
            .catch((err) => {
            logger_1.errorLogger.error(colors_1.default.red('Error closing database connection'), err);
            process.exit(1);
        });
    }
    else {
        process.exit(0);
    }
    // Force shutdown after timeout if graceful shutdown fails
    setTimeout(() => {
        logger_1.errorLogger.error(colors_1.default.red(`Forcing shutdown after ${SHUTDOWN_TIMEOUT_MS}ms timeout`));
        process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
}
