import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { NotificationController } from './notification.controller';
import auth from '../../middleware/auth';

const router = express.Router();

// ✅ User notifications
router.get(
  '/',
  auth(USER_ROLES.USER),
  NotificationController.getUserNotifications
);

router.patch(
  '/',
  auth(USER_ROLES.USER),
  NotificationController.markUserNotificationsAsRead
);


export const NotificationRoutes = router;
