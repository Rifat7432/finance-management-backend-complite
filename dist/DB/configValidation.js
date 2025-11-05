"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = validateConfig;
const colors_1 = __importDefault(require("colors"));
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../shared/logger");
// Function to validate required configuration values
function validateConfig() {
    const requiredConfigs = ['database_url', 'port', 'socket_port', 'ip_address'];
    const missingConfigs = requiredConfigs.filter((key) => !config_1.default[key]);
    if (missingConfigs.length > 0) {
        throw new Error(`Missing required environment variables: ${missingConfigs.join(', ')}`);
    }
    // Validate port numbers
    if (isNaN(Number(config_1.default.port)) || isNaN(Number(config_1.default.socket_port))) {
        throw new Error('Port and socket port must be valid numbers');
    }
    // Log successful validation
    logger_1.logger.info(colors_1.default.green('Config validation successful.'));
}
