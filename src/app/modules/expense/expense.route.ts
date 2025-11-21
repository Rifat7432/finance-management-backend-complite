import express from 'express';
import { ExpenseController } from './expense.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middleware/validateRequest';
import { ExpenseValidation } from './expense.validation';

const router = express.Router();

router.post('/', auth(USER_ROLES.USER), validateRequest(ExpenseValidation.createExpenseZodSchema), ExpenseController.createExpense);

router.get('/', auth(USER_ROLES.USER), ExpenseController.getUserExpenses);
router.get('/frequency', auth(USER_ROLES.USER), ExpenseController.getUserExpensesByFrequency);
router.get('/analytics', auth(USER_ROLES.USER), ExpenseController.getYearlyExpenseAnalytics);

router.get('/expense/:id', auth(USER_ROLES.USER), ExpenseController.getSingleExpense);

router.patch('/:id', auth(USER_ROLES.USER), validateRequest(ExpenseValidation.updateExpenseZodSchema), ExpenseController.updateExpense);

router.delete('/:id', auth(USER_ROLES.USER), ExpenseController.deleteExpense);

export const ExpenseRouter = router;
