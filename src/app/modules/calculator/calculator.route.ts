import express from 'express';
import { CalculatorController } from './calculator.controller';
import auth from '../../middleware/auth';
import { CalculatorValidation } from './calculator.validation';
import validateRequest from '../../middleware/validateRequest';

const router = express.Router();

router.post('/saving-calculator', validateRequest(CalculatorValidation.SavingCalculatorContentZodSchema), auth(), CalculatorController.getSavingCalculator);
router.post('/loan-repayment-calculator', validateRequest(CalculatorValidation.RepaymentCalculatorZodSchema), auth(), CalculatorController.getLoanRepaymentCalculator);
router.post('/inflation-calculator', validateRequest(CalculatorValidation.InflationCalculatorZodSchema), auth(), CalculatorController.getInflationCalculator);
router.post(
     '/historical-inflation-calculator',
     validateRequest(CalculatorValidation.HistoricalInflationCalculatorZodSchema),
     auth(),
     CalculatorController.getHistoricalInflationCalculator,
);

export const CalculatorRouter = router;
