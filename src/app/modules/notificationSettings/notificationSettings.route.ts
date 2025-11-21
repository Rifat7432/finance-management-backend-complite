import express from 'express';
import { NotificationSettingsController } from './notificationSettings.controller';
import validateRequest from '../../middleware/validateRequest';
import { NotificationSettingsValidation } from './notificationSettings.validation';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';

const router = express.Router();
router.get('/', auth(USER_ROLES.USER), NotificationSettingsController.getNotificationSettings);
router.patch('/', auth(USER_ROLES.USER), validateRequest(NotificationSettingsValidation.updateNotificationSettingsZodSchema), NotificationSettingsController.updateNotificationSettings);

export const NotificationSettingsRouter = router;
