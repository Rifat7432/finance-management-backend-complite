import { StatusCodes } from 'http-status-codes';
import { IIncome } from './income.interface';
import { Income } from './income.model';
import AppError from '../../../errors/AppError';
import { getEndOfMonthUTC, getEndOfYearUTC, getStartOfMonthUTC, getStartOfYearUTC, toUTC } from '../../../utils/dateTimeHelper';

// Create new income
const createIncomeToDB = async (payload: Partial<IIncome>, userId: string): Promise<IIncome> => {
     const { receiveDate, ...rest } = payload;
     const utcReceiveDate = toUTC(receiveDate as Date);
     const newIncome = await Income.create({ ...rest, receiveDate: utcReceiveDate, userId });
     if (!newIncome) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create income');
     }
     return newIncome;
};

// Get incomes by user
const getUserIncomesFromDB = async (userId: string, query: Partial<IIncome>): Promise<IIncome[]> => {
     const monthStart = getStartOfMonthUTC();
     const yearStart = getStartOfYearUTC();
     const monthEnd = getEndOfMonthUTC();
     const yearEnd = getEndOfYearUTC();
     const incomes = await Income.find({
          isDeleted: false,
          userId,
          ...(query.frequency
               ? query.frequency === 'monthly'
                    ? {
                           receiveDate: {
                                // CHANGED FROM createdAt
                                $gte: monthStart,
                                $lte: monthEnd,
                           },
                      }
                    : query.frequency === 'yearly'
                      ? {
                             receiveDate: {
                                  // CHANGED FROM createdAt
                                  $gte: yearStart,
                                  $lte: yearEnd,
                             },
                        }
                      : { frequency: query.frequency }
               : {}),
     });
     return incomes;
};
// Get incomes by user  by frequency
const getUserIncomesByFrequencyFromDB = async (userId: string, query: Partial<IIncome>) => {
     const monthStart = getStartOfMonthUTC();
     const monthEnd = getEndOfMonthUTC();
     const incomes = await Income.find({
          isDeleted: false,
          userId,
          ...(query.frequency ? { frequency: query.frequency } : {}),
          receiveDate: {
               // CHANGED FROM createdAt
               $gte: monthStart,
               $lte: monthEnd,
          },
     });

     return incomes;
};

// Get single income by ID
const getSingleIncomeFromDB = async (id: string): Promise<IIncome | null> => {
     const income = await Income.findById(id);
     if (!income) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Income not found');
     }
     if (income.isDeleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Income Deleted');
     }
     return income;
};

// Update income by ID
const updateIncomeToDB = async (id: string, payload: Partial<IIncome>): Promise<IIncome | null> => {
     const isIncomeExist = await Income.findOne({ _id: id, isDeleted: false });
     if (!isIncomeExist) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Income not found');
     }
     const updated = await Income.findByIdAndUpdate(id, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update income');
     }
     return updated;
};

// Delete income (soft delete)
const deleteIncomeFromDB = async (id: string): Promise<boolean> => {
     const isIncomeExist = await Income.findOne({ _id: id, isDeleted: false });
     if (!isIncomeExist) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Income is already deleted or not found');
     }
     const deleted = await Income.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
     if (!deleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Income not found');
     }
     return true;
};

export const IncomeService = {
     createIncomeToDB,
     getUserIncomesFromDB,
     getUserIncomesByFrequencyFromDB,
     getSingleIncomeFromDB,
     updateIncomeToDB,
     deleteIncomeFromDB,
};
