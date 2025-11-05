import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { CalculatorService } from './calculator.service';

// Get Calculator results
const getSavingCalculator = catchAsync(async (req, res) => {
     const payload = req.body; // Assumes Zod validation runs before this
     const data = await CalculatorService.getSavingCalculatorFromDB(payload);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Calculator results retrieved successfully',
          data: data,
     });
});
// Get Calculator results
const getLoanRepaymentCalculator = catchAsync(async (req, res) => {
     const payload = req.body; // Assumes Zod validation runs before this
     const data = await CalculatorService.loanRepaymentCalculatorFromDB(payload);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Calculator results retrieved successfully',
          data: data,
     });
});
// Get Calculator results
const getInflationCalculator = catchAsync(async (req, res) => {
     const payload = req.body; // Assumes Zod validation runs before this
     const data = await CalculatorService.inflationCalculatorFromDB(payload);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Calculator results retrieved successfully',
          data: data,
     });
});
// Get Calculator results
const getHistoricalInflationCalculator = catchAsync(async (req, res) => {
     const payload = req.body; // Assumes Zod validation runs before this
     const data = await CalculatorService.inflationCalculatorFromAPI(payload);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Calculator results retrieved successfully',
          data: data,
     });
});

export const CalculatorController = {
     getSavingCalculator,
     getLoanRepaymentCalculator,
     getInflationCalculator,
     getHistoricalInflationCalculator
};
