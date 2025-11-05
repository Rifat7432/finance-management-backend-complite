import { createServer, Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import colors from 'colors';
import { validateConfig } from './DB/configValidation';
import { connectToDatabase } from './DB/db';
import app from './app';
import config from './config';
import { logger } from './shared/logger';
import { socketHelper } from './helpers/socketHelper';
import { setupProcessHandlers } from './DB/processHandlers';
import { setupSecurity } from './DB/security';
import { setupCluster } from './DB/cluster';

// Define the types for the servers
let httpServer: HttpServer;
let socketServer: SocketServer;

// Function to start the server
export async function startServer() {
     try {
          // Validate config
          validateConfig();
          // Connect to the database
          await connectToDatabase();
          // Create HTTP server
          httpServer = createServer(app);
          const httpPort = Number(config.port);
          const socketPort = Number(config.socket_port);
          const ipAddress = config.ip_address as string;

          // Set timeouts
          httpServer.timeout = 120000;
          httpServer.keepAliveTimeout = 5000;
          httpServer.headersTimeout = 60000;

          // Set up Socket.io server on the same HTTP server
          socketServer = new SocketServer(httpServer, {
               cors: {
                    origin: config.allowed_origins || '*',
                    methods: ['GET', 'POST'],
                    credentials: true,
               },
          });

          // socketServer.listen(socketPort);
          socketHelper.socket(socketServer);

          // Start HTTP server (and socket.io on same port)
          httpServer.listen(httpPort, ipAddress, () => {
               logger.info(colors.yellow(`♻️  Application & Socket listening on http://${ipAddress}:${httpPort} or http://localhost:${httpPort} in ${config.node_env} mode`));
          });
     } catch (error) {
          logger.error(colors.red('Failed to start server'), error);
          process.exit(1);
     }
}
// Set up error handlers
setupProcessHandlers();
// Set up security middleware
setupSecurity();
if (config.node_env === 'production') {
     setupCluster();
} else {
     startServer();
}
// Export server instances
export { httpServer, socketServer };
