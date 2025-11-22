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
exports.setupMongooseListeners = setupMongooseListeners;
exports.connectToDatabase = connectToDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const colors_1 = __importDefault(require("colors"));
const logger_1 = require("../shared/logger");
const config_1 = __importDefault(require("../config"));
const admin_1 = require("../seed/admin");
// Set up MongoDB connection listeners
function setupMongooseListeners() {
    mongoose_1.default.connection.on('error', (err) => {
        logger_1.errorLogger.error(colors_1.default.red('MongoDB connection error:'), err);
        if (config_1.default.node_env === 'production') {
            logger_1.logger.error(colors_1.default.red('Critical database error - restarting worker'));
            process.exit(1);
        }
    });
    mongoose_1.default.connection.on('disconnected', () => {
        logger_1.logger.warn(colors_1.default.yellow('MongoDB disconnected. Attempting to reconnect...'));
    });
    mongoose_1.default.connection.on('reconnected', () => {
        logger_1.logger.info(colors_1.default.green('MongoDB reconnected successfully'));
    });
    mongoose_1.default.connection.on('reconnectFailed', () => {
        logger_1.errorLogger.error(colors_1.default.red('MongoDB reconnection failed after multiple attempts'));
        if (config_1.default.node_env === 'production') {
            process.exit(1);
        }
    });
}
// Connect to MongoDB
function connectToDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(config_1.default.database_url, {
                serverSelectionTimeoutMS: 5000,
                heartbeatFrequencyMS: 10000,
                maxPoolSize: config_1.default.node_env === 'production' ? 100 : 10,
                minPoolSize: config_1.default.node_env === 'production' ? 5 : 2,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                family: 4, // Force IPv4
                retryWrites: true,
                retryReads: true,
            });
            logger_1.logger.info(colors_1.default.bgCyan('🚀 Database connected successfully'));
            setupMongooseListeners();
            yield (0, admin_1.seedAdmin)();
        }
        catch (error) {
            logger_1.errorLogger.error(colors_1.default.red('Database connection error'), error);
            process.exit(1);
        }
    });
}
