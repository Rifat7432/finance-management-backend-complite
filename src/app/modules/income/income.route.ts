import express from 'express';
import { IncomeController } from './income.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middleware/validateRequest';
import { IncomeValidation } from './income.validation';
// optional if using Zod/Joi

const router = express.Router();

// Create new income
router.post(
  '/',
  auth(USER_ROLES.USER),
  validateRequest(IncomeValidation.createIncomeZodSchema), // Optional if using Zod
  IncomeController.createIncome
);

// Get all incomes for logged-in user
router.get(
  '/',
  auth(USER_ROLES.USER),
  IncomeController.getUserIncomes
);
// Get all incomes for logged-in user by frequency
router.get(
  '/frequency',
  auth(USER_ROLES.USER),
  IncomeController.getUserIncomesByFrequency
);

// Get a single income
router.get(
  '/income/:id',
  auth(USER_ROLES.USER),
  IncomeController.getSingleIncome
);

// Update income
router.patch(
  '/:id',
  auth(USER_ROLES.USER),
  validateRequest(IncomeValidation.updateIncomeZodSchema), // Optional
  IncomeController.updateIncome
);

// Delete income
router.delete(
  '/:id',
  auth(USER_ROLES.USER),
  IncomeController.deleteIncome
);

export const IncomeRouter = router;
