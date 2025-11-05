import express from 'express';
import { AnalyticsController } from './analytics.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();



router.get('/',auth(USER_ROLES.USER),AnalyticsController.getAnalytics)
router.get('/user-last-update',auth(USER_ROLES.USER),AnalyticsController.getLatestUpdate)

export const AnalyticsRouter = router;
