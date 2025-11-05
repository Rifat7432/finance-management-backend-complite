import { StatusCodes } from 'http-status-codes';
import { Debt } from './debt.model';
import AppError from '../../../errors/AppError';
import { IDebt } from './debt.interface';

// Create new debt
const createDebtToDB = async (payload: Partial<IDebt>, userId: string): Promise<IDebt> => {
     const newDebt = await Debt.create({ ...payload, userId });
     if (!newDebt) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create debt');
     }
     return newDebt;
};

const getDebtInsightsFromDB = async (userId: string) => {
     const debts = await Debt.find({ userId, isDeleted: false });

     if (!debts.length) {
          return {
               suggestedOrder: [],
               summary: {
                    totalDebt: 0,
                    avgInterestRate: 0,
                    monthlyPayment: 0,
               },
          };
     }

     // Calculate interestRate on the fly
     const debtsWithRate = debts.map((d) => {
          const totalPayment = Number(d.capitalRepayment) + Number(d.interestRepayment);
          const interestRate = totalPayment > 0 ? (Number(d.interestRepayment) / totalPayment) * 100 : 0;

          return {
               name: d.name,
               amount: d.amount,
               monthlyPayment: Number(d.monthlyPayment),
               AdHocPayment: Number(d.AdHocPayment),
               capitalRepayment: Number(d.capitalRepayment),
               interestRepayment: Number(d.interestRepayment),
               interestRate: parseFloat(interestRate.toFixed(2)),
               payDueDate: d.payDueDate,
          };
     });

     // 1. Suggested Payment Order (top 3 by interestRate)
     const suggestedOrder = debtsWithRate
          .sort((a, b) => b.interestRate - a.interestRate)
          .slice(0, 3)
          .map((d) => ({ name: d.name, interestRate: d.interestRate }));

     // 2. Debt Summary
     const totalDebt = debtsWithRate.reduce((sum, d) => sum + d.amount, 0);

     const avgInterestRate = debtsWithRate.reduce((sum, d) => sum + d.interestRate, 0) / debtsWithRate.length;

     const monthlyPayment = debtsWithRate.reduce((sum, d) => sum + d.monthlyPayment, 0);

     return {
          suggestedOrder,
          summary: {
               totalDebt,
               avgInterestRate: parseFloat(avgInterestRate.toFixed(2)),
               monthlyPayment,
          },
          debts: debtsWithRate.sort((a, b) => b.interestRate - a.interestRate).slice(0, 3),
     };
};

// Get all debts for a user
const getUserDebtsFromDB = async (userId: string): Promise<IDebt[]> => {
     const debts = await Debt.find({ userId, isDeleted: false });
     if (!debts.length) {
          throw new AppError(StatusCodes.NOT_FOUND, 'No debts found for this user');
     }
     return debts;
};

// Get a single debt
const getSingleDebtFromDB = async (id: string): Promise<IDebt | null> => {
     const debt = await Debt.findById(id);
     if (!debt || debt.isDeleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Debt not found or deleted');
     }
     return debt;
};

// Update debt
const updateDebtToDB = async (id: string, payload: Partial<IDebt>): Promise<IDebt | null> => {
     const debt = await Debt.findById(id);
     if (!debt || debt.isDeleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Debt not found or deleted');
     }
     const updated = await Debt.findByIdAndUpdate(id, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update debt');
     }
     return updated;
};

// Delete debt
const deleteDebtFromDB = async (id: string): Promise<boolean> => {
     const debt = await Debt.findById(id);
     if (!debt || debt.isDeleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Debt not found or deleted already');
     }
     const deleted = await Debt.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
     if (!deleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Debt not found');
     }
     return true;
};

export const DebtService = {
     createDebtToDB,
     getUserDebtsFromDB,
     getSingleDebtFromDB,
     updateDebtToDB,
     deleteDebtFromDB,
     getDebtInsightsFromDB,
};
