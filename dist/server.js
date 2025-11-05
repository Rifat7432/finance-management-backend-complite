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
exports.socketServer = exports.httpServer = void 0;
exports.startServer = startServer;
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const colors_1 = __importDefault(require("colors"));
const configValidation_1 = require("./DB/configValidation");
const db_1 = require("./DB/db");
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const logger_1 = require("./shared/logger");
const socketHelper_1 = require("./helpers/socketHelper");
const processHandlers_1 = require("./DB/processHandlers");
const security_1 = require("./DB/security");
const cluster_1 = require("./DB/cluster");
// Define the types for the servers
let httpServer;
let socketServer;
// Function to start the server
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Validate config
            (0, configValidation_1.validateConfig)();
            // Connect to the database
            yield (0, db_1.connectToDatabase)();
            // Create HTTP server
            exports.httpServer = httpServer = (0, http_1.createServer)(app_1.default);
            const httpPort = Number(config_1.default.port);
            const socketPort = Number(config_1.default.socket_port);
            const ipAddress = config_1.default.ip_address;
            // Set timeouts
            httpServer.timeout = 120000;
            httpServer.keepAliveTimeout = 5000;
            httpServer.headersTimeout = 60000;
            // Set up Socket.io server on the same HTTP server
            exports.socketServer = socketServer = new socket_io_1.Server(httpServer, {
                cors: {
                    origin: config_1.default.allowed_origins || '*',
                    methods: ['GET', 'POST'],
                    credentials: true,
                },
            });
            // socketServer.listen(socketPort);
            socketHelper_1.socketHelper.socket(socketServer);
            // Start HTTP server (and socket.io on same port)
            httpServer.listen(httpPort, ipAddress, () => {
                logger_1.logger.info(colors_1.default.yellow(`♻️  Application & Socket listening on http://${ipAddress}:${httpPort} or http://localhost:${httpPort} in ${config_1.default.node_env} mode`));
            });
        }
        catch (error) {
            logger_1.logger.error(colors_1.default.red('Failed to start server'), error);
            process.exit(1);
        }
    });
}
// Set up error handlers
(0, processHandlers_1.setupProcessHandlers)();
// Set up security middleware
(0, security_1.setupSecurity)();
if (config_1.default.node_env === 'production') {
    (0, cluster_1.setupCluster)();
}
else {
    startServer();
}
