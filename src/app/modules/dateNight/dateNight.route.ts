import express from 'express';
import { DateNightController } from './dateNight.controller';
import validateRequest from '../../middleware/validateRequest';
import { DateNightValidation } from './dateNight.validation';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.post('/', auth(USER_ROLES.USER), validateRequest(DateNightValidation.createDateNightZodSchema), DateNightController.createDateNight);

router.get('/', auth(USER_ROLES.USER), DateNightController.getDateNights);

router.get('/:id', auth(USER_ROLES.USER), DateNightController.getSingleDateNight);

router.patch('/:id', auth(USER_ROLES.USER), validateRequest(DateNightValidation.updateDateNightZodSchema), DateNightController.updateDateNight);

router.delete('/:id', auth(USER_ROLES.USER), DateNightController.deleteDateNight);

export const DateNightRouter = router;
