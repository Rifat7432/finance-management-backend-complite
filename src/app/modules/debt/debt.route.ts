import express from 'express';
import { DebtController } from './debt.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middleware/validateRequest';
import { DebtValidation } from './debt.validation';

const router = express.Router();

router.post(
  '/',
  auth(USER_ROLES.USER),
  validateRequest(DebtValidation.createDebtZodSchema),
  DebtController.createDebt
);

router.get(
  '/',
  auth(USER_ROLES.USER),
  DebtController.getUserDebts
);
router.get(
  '/insights',
  auth(USER_ROLES.USER),
  DebtController.getDebtInsights
);

router.get(
  '/single/:id',
  auth(USER_ROLES.USER),
  DebtController.getSingleDebt
);

router.patch(
  '/:id',
  auth(USER_ROLES.USER),
  validateRequest(DebtValidation.updateDebtZodSchema),
  DebtController.updateDebt
);

router.delete(
  '/:id',
  auth(USER_ROLES.USER),
  DebtController.deleteDebt
);

export const DebtRouter = router;
