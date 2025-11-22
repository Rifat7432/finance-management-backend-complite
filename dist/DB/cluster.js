"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCluster = setupCluster;
const os_1 = __importDefault(require("os"));
const colors_1 = __importDefault(require("colors"));
const logger_1 = require("../shared/logger");
const server_1 = require("../server");
const cluster_1 = __importDefault(require("cluster"));
const CONFIG = {
    WORKER_RESTART_DELAY: 5000,
    MAX_RESTART_ATTEMPTS: 5,
    MAX_BACKOFF_DELAY: 60000,
    WORKER_COUNT: process.env.NODE_ENV === 'production' ? os_1.default.cpus().length : Math.max(2, Math.min(4, os_1.default.cpus().length)),
};
function setupCluster() {
    if (cluster_1.default.isPrimary) {
        const workerRestarts = new Map();
        let shuttingDown = false;
        logger_1.logger.info(colors_1.default.blue(`Master ${process.pid} is running`));
        logger_1.logger.info(colors_1.default.blue(`Starting ${CONFIG.WORKER_COUNT} workers...`));
        for (let i = 0; i < CONFIG.WORKER_COUNT; i++) {
            cluster_1.default.fork();
        }
        cluster_1.default.on('message', (worker, message) => {
            if (message === 'ready') {
                logger_1.logger.info(colors_1.default.green(`Worker ${worker.process.pid} is ready to accept connections`));
            }
        });
        cluster_1.default.on('exit', (worker, code, signal) => {
            const pid = worker.process.pid || 0;
            const restarts = workerRestarts.get(pid) || 0;
            if (shuttingDown) {
                logger_1.logger.info(colors_1.default.blue(`Worker ${pid} exited during shutdown, not restarting`));
                return;
            }
            if (signal) {
                logger_1.logger.warn(colors_1.default.yellow(`Worker ${pid} was killed by signal: ${signal}`));
            }
            else if (code !== 0) {
                logger_1.logger.warn(colors_1.default.yellow(`Worker ${pid} exited with error code: ${code}`));
            }
            else {
                logger_1.logger.info(colors_1.default.blue(`Worker ${pid} exited successfully`));
                const newWorker = cluster_1.default.fork();
                logger_1.logger.info(colors_1.default.blue(`Replacing worker ${pid} with new worker ${newWorker.process.pid}`));
                return;
            }
            if (restarts < CONFIG.MAX_RESTART_ATTEMPTS) {
                const delay = Math.min(CONFIG.WORKER_RESTART_DELAY * Math.pow(2, restarts), CONFIG.MAX_BACKOFF_DELAY);
                logger_1.logger.info(colors_1.default.blue(`Restarting worker ${pid} in ${delay}ms (attempt ${restarts + 1})`));
                setTimeout(() => {
                    const newWorker = cluster_1.default.fork();
                    workerRestarts.set(newWorker.process.pid || 0, restarts + 1);
                }, delay);
            }
            else {
                logger_1.logger.error(colors_1.default.red(`Worker ${pid} failed to restart after ${CONFIG.MAX_RESTART_ATTEMPTS} attempts`));
            }
        });
        ['SIGINT', 'SIGTERM'].forEach((signal) => {
            process.on(signal, () => {
                shuttingDown = true;
                logger_1.logger.info(colors_1.default.yellow(`Primary ${process.pid} received ${signal}, initiating graceful shutdown...`));
                for (const id in cluster_1.default.workers) {
                    const worker = cluster_1.default.workers[id];
                    if (worker) {
                        worker.process.kill('SIGTERM');
                    }
                }
                setTimeout(() => {
                    logger_1.logger.error(colors_1.default.red('Forced shutdown after timeout'));
                    process.exit(1);
                }, 30000);
            });
        });
    }
    else {
        logger_1.logger.info(colors_1.default.blue(`Worker ${process.pid} started`));
        process.on('uncaughtException', (error) => {
            logger_1.errorLogger.error(colors_1.default.red(`Worker ${process.pid} uncaught exception`), error);
            setTimeout(() => process.exit(1), 1000);
        });
        // Start the server
        (0, server_1.startServer)()
            .then(() => {
            if (process.send) {
                process.send('ready');
            }
        })
            .catch((error) => {
            logger_1.errorLogger.error(colors_1.default.red(`Worker ${process.pid} failed to start`), error);
            process.exit(1);
        });
        process.on('SIGTERM', () => {
            logger_1.logger.info(colors_1.default.yellow(`Worker ${process.pid} received SIGTERM, shutting down gracefully...`));
            setTimeout(() => {
                logger_1.logger.info(colors_1.default.blue(`Worker ${process.pid} exiting after cleanup`));
                process.exit(0);
            }, 5000);
        });
    }
}
