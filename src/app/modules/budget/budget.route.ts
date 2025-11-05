import express from 'express';
import { BudgetController } from './budget.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middleware/validateRequest';
import { BudgetValidation } from './budget.validation';

const router = express.Router();

router.post('/', auth(USER_ROLES.USER), validateRequest(BudgetValidation.createBudgetZodSchema), BudgetController.createBudget);

router.get('/', auth(USER_ROLES.USER), BudgetController.getUserBudgets);

router.get('/type', auth(USER_ROLES.USER), BudgetController.getUserBudgetsByType);
router.get('/analytics', auth(USER_ROLES.USER), BudgetController.getYearlyBudgetAnalytics);

router.patch('/:id', auth(USER_ROLES.USER), validateRequest(BudgetValidation.updateBudgetZodSchema), BudgetController.updateBudget);

router.delete('/:id', auth(USER_ROLES.USER), BudgetController.deleteBudget);

export const BudgetRouter = router;
