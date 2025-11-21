import { DefaultEventsMap, Server } from 'socket.io';
import jwt, { Secret } from 'jsonwebtoken';
import colors from 'colors';
import { logger } from '../shared/logger';
import config from '../config';
import { verifyToken } from '../utils/verifyToken';


export let socketIo: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

const socket = (io: Server) => {
  socketIo = io;

  // Middleware to verify token before connection
  io.use((socket, next) => {
   const token = socket.handshake.query.token as string;
    if (!token) {
      logger.warn('Socket connection rejected: No token provided');
      return next(new Error('Authentication error'));
    }

    try {
      const verifyUser = verifyToken(token, config.jwt.jwt_secret as Secret);
      socket.data.userId = verifyUser.id; // attach user ID to socket
      next();
    } catch (error) {
      logger.warn('Socket connection rejected: Invalid token');
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    logger.info(colors.blue(`User ${userId} connected via socket`));

    // Join a room with the user's ID
    socket.join(userId);

    socket.on('disconnect', () => {
      logger.info(colors.red(`User ${userId} disconnected`));
    });
  });
};

export const socketHelper = { socket };
