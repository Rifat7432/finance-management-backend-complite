import * as admin from 'firebase-admin';
import { logger } from '../shared/logger';
import serviceAccount from '../../finace-management-72997-firebase-adminsdk-fbsvc-4bf112f98e.json';


const serviceAccountKey: admin.ServiceAccount = serviceAccount as admin.ServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

// Generic reusable method
interface PushMessage {
  title: string;
  body: string;
}

type NotificationType = 'single' | 'multiple';

interface User {
  id: string;
  deviceToken?: string | null;
}

const sendNotification = async (
  users: User[] | User,
  message: PushMessage,
  deviceTokens?: string[],
  type: NotificationType = 'multiple',
  data: Record<string, string> = {}
) => {
  let tokens: string[] = [];

  if (type === 'single') {
    const token =
      deviceTokens?.[0] || (Array.isArray(users) ? users[0]?.deviceToken : (users as User).deviceToken);
    if (!token) {
      logger.warn('No device token provided for single notification');
      return;
    }
    try {
      const response = await admin.messaging().send({
        notification: message,
        data,
        token,
      });
      logger.info('Single notification sent successfully', response);
    } catch (err) {
      logger.error('Error sending single push notification', err);
    }
  } else {
    // multiple
    tokens = deviceTokens || (Array.isArray(users) ? users.map(u => u.deviceToken).filter((t): t is string => !!t) : []);
    if (tokens.length === 0) {
      logger.warn('No valid device tokens for multiple notifications');
      return;
    }

    const multicastMessage: admin.messaging.MulticastMessage = {
      notification: message,
      data,
      tokens,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(multicastMessage);
      logger.info('Multiple notifications sent successfully', {
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      // Remove invalid tokens
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-argument'
          ) {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        logger.info('Removing invalid tokens', invalidTokens);
        // TODO: remove from DB
      }
    } catch (err) {
      logger.error('Error sending multiple push notifications', err);
    }
  }
};

export const firebaseHelper = {
  sendNotification,
};
