"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketHelper = exports.socketIo = void 0;
const colors_1 = __importDefault(require("colors"));
const logger_1 = require("../shared/logger");
const config_1 = __importDefault(require("../config"));
const verifyToken_1 = require("../utils/verifyToken");
const socket = (io) => {
    exports.socketIo = io;
    // Middleware to verify token before connection
    io.use((socket, next) => {
        const token = socket.handshake.query.token;
        if (!token) {
            logger_1.logger.warn('Socket connection rejected: No token provided');
            return next(new Error('Authentication error'));
        }
        try {
            const verifyUser = (0, verifyToken_1.verifyToken)(token, config_1.default.jwt.jwt_secret);
            socket.data.userId = verifyUser.id; // attach user ID to socket
            next();
        }
        catch (error) {
            logger_1.logger.warn('Socket connection rejected: Invalid token');
            next(new Error('Authentication error'));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.data.userId;
        logger_1.logger.info(colors_1.default.blue(`User ${userId} connected via socket`));
        // Join a room with the user's ID
        socket.join(userId);
        socket.on('disconnect', () => {
            logger_1.logger.info(colors_1.default.red(`User ${userId} disconnected`));
        });
    });
};
exports.socketHelper = { socket };
