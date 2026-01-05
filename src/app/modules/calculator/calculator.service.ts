import fetch from 'node-fetch';

import { Schema, model, Types } from 'mongoose';

export interface ISavingCalculation {
     // User input
     amount: number;
     frequency: 'Monthly' | 'Yearly';
     returnRate: number;
     years: number;
     inflationRate: number;
     taxRate: number;

     // Calculated results
     totalSavedBeforeTax: number;
     afterTax: number;
     inflationAdjustedValue: number;
     netGain: number;

     // Metadata
     userId: Types.ObjectId;
}
export interface ILoanRepaymentCalculation {
     // User input
     principal: number;
     annualInterestRate: number;
     loanTermYears: number;

     // Calculated results
     monthlyPayment: number;
     totalPayableAmount: number;

     // Metadata
     userId: Types.ObjectId;
}

export interface IInflationCalculation {
     // User input
     initialAmount: number;
     annualInflationRate: number;
     years: number;

     // Calculated result
     futureValue: number;

     // Metadata
     userId: Types.ObjectId;
}
export interface IInflationApiCalculation {
     // User input
     fromYear: number;
     toYear: number;
     amount: number;

     // Calculated results
     valueInFromYear: number;
     totalInflation: number;

     // Context / metadata
     countryCode: string;
     dataSource: string;

     // User reference
     userId: Types.ObjectId;
}
const savingCalculationSchema = new Schema<ISavingCalculation>(
     {
          // Inputs
          amount: { type: Number, required: true },
          frequency: {
               type: String,
               enum: ['Monthly', 'Yearly'],
               required: true,
          },
          returnRate: { type: Number, required: true },
          years: { type: Number, required: true },
          inflationRate: { type: Number, required: true },
          taxRate: { type: Number, required: true },

          // Outputs
          totalSavedBeforeTax: { type: Number, required: true },
          afterTax: { type: Number, required: true },
          inflationAdjustedValue: { type: Number, required: true },
          netGain: { type: Number, required: true },

          // Metadata
          userId: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: true,
          },
     },
     { timestamps: true },
);

const loanRepaymentCalculationSchema = new Schema<ILoanRepaymentCalculation>(
     {
          // Inputs
          principal: { type: Number, required: true },
          annualInterestRate: { type: Number, required: true },
          loanTermYears: { type: Number, required: true },

          // Outputs
          monthlyPayment: { type: Number, required: true },
          totalPayableAmount: { type: Number, required: true },

          // Metadata
          userId: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: true,
          },
     },
     { timestamps: true },
);

const inflationCalculationSchema = new Schema<IInflationCalculation>(
     {
          // Inputs
          initialAmount: { type: Number, required: true },
          annualInflationRate: { type: Number, required: true },
          years: { type: Number, required: true },

          // Output
          futureValue: { type: Number, required: true },

          // Metadata
          userId: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: true,
          },
     },
     { timestamps: true },
);

const inflationApiCalculationSchema = new Schema<IInflationApiCalculation>(
     {
          // Inputs
          fromYear: { type: Number, required: true },
          toYear: { type: Number, required: true },
          amount: { type: Number, required: true },

          // Outputs
          valueInFromYear: { type: Number, required: true },
          totalInflation: { type: Number, required: true },

          // Context
          countryCode: {
               type: String,
               default: 'GB',
          },
          dataSource: {
               type: String,
               default: 'World Bank API',
          },

          // User reference
          userId: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: true,
          },
     },
     { timestamps: true },
);

const InflationApiCalculation = model<IInflationApiCalculation>('InflationApiCalculation', inflationApiCalculationSchema);

const LoanRepaymentCalculation = model<ILoanRepaymentCalculation>('LoanRepaymentCalculation', loanRepaymentCalculationSchema);
const SavingCalculation = model<ISavingCalculation>('SavingCalculation', savingCalculationSchema);

const InflationCalculation = model<IInflationCalculation>('InflationCalculation', inflationCalculationSchema);

async function getSavingCalculatorFromDB(payload: { amount: number; frequency: string; returnRate: number; years: number; inflationRate: number; taxRate: number }, userId: string) {
     const { amount, frequency, returnRate, years, inflationRate, taxRate } = payload;

     const periodsPerYear = frequency === 'Monthly' ? 12 : 1;
     const periodicRate = returnRate / 100 / periodsPerYear;
     const totalPeriods = years * periodsPerYear;

     // Future value formula for annuity
     const futureValue = amount * ((Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate);

     const totalContributions = amount * totalPeriods; // Principal only
     const interestEarned = futureValue - totalContributions;

     const taxPaid = interestEarned * (taxRate / 100);
     const afterTaxValue = futureValue - taxPaid;

     const inflationAdjusted = afterTaxValue / Math.pow(1 + inflationRate / 100, years);

     const netGain = inflationAdjusted - totalContributions;

     const result = {
          totalSavedBeforeTax: Number(futureValue.toFixed(2)),
          afterTax: Number(afterTaxValue.toFixed(2)),
          inflationAdjustedValue: Number(inflationAdjusted.toFixed(2)),
          netGain: Number(netGain.toFixed(2)),
     };

     await SavingCalculation.create({
          userId: userId,
          amount,
          frequency,
          returnRate,
          years,
          inflationRate,
          taxRate,
          totalSavedBeforeTax: result.totalSavedBeforeTax,
          afterTax: result.afterTax,
          inflationAdjustedValue: result.inflationAdjustedValue,
          netGain: result.netGain,
          isDeleted: false,
     });

     return result;
}

const loanRepaymentCalculatorFromDB = async (payload: { principal: number; annualInterestRate: number; loanTermYears: number }, userId: string) => {
     const { principal, loanTermYears, annualInterestRate } = payload;
     const monthlyInterestRate = annualInterestRate / 100 / 12;
     const totalPayments = loanTermYears * 12;
     let monthlyPayment: number;
     if (monthlyInterestRate === 0) {
          monthlyPayment = principal / totalPayments;
     } else {
          monthlyPayment = (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPayments)) / (Math.pow(1 + monthlyInterestRate, totalPayments) - 1);
     }
     const totalPayableAmount = monthlyPayment * totalPayments;

     const result = {
          monthlyPayment: Math.round(monthlyPayment * 100) / 100,
          totalPayableAmount: Math.round(totalPayableAmount * 100) / 100,
     };

     // Store calculation in MongoDB
     await LoanRepaymentCalculation.create({
          userId: userId,
          principal,
          annualInterestRate,
          loanTermYears,
          monthlyPayment: result.monthlyPayment,
          totalPayableAmount: result.totalPayableAmount,
          isDeleted: false,
     });

     return result;
};
const inflationCalculatorFromDB = async (payload: { initialAmount: number; annualInflationRate: number; years: number }, userId: string) => {
     const { initialAmount, annualInflationRate, years } = payload;
     const rateDecimal = annualInflationRate / 100;
     const futureValue = initialAmount * Math.pow(1 + rateDecimal, years);

     const result = {
          futureValue: Math.round(futureValue * 100) / 100,
     };

     // Save calculation to MongoDB
     await InflationCalculation.create({
          userId: userId,
          initialAmount,
          annualInflationRate,
          years,
          futureValue: result.futureValue,
          isDeleted: false,
     });

     return result;
};

const inflationCalculatorFromAPI = async (payload: { fromYear: number; toYear: number; amount: number }, userId: string) => {
     const { fromYear, toYear, amount } = payload;

     const url = `https://api.worldbank.org/v2/country/GB/indicator/FP.CPI.TOTL.ZG?format=json&per_page=1000`;
     const response = await fetch(url);

     if (!response.ok) throw new Error('Failed to fetch inflation data from World Bank');

     const data = await response.json();
     if (!Array.isArray(data) || !data[1]) throw new Error('Invalid API response format');

     // Extract annual inflation rates (%)
     const inflationRates: Record<number, number> = {};
     for (const entry of data[1]) {
          const year = parseInt(entry.date);
          const value = parseFloat(entry.value);
          if (!isNaN(year) && !isNaN(value)) inflationRates[year] = value;
     }

     // Ensure valid years
     if (fromYear >= toYear) throw new Error('From year must be less than To year');

     const relevantYears = Object.keys(inflationRates)
          .map(Number)
          .filter((y) => y > fromYear && y <= toYear)
          .sort((a, b) => a - b);

     if (relevantYears.length === 0) throw new Error(`No inflation data found between ${fromYear} and ${toYear}`);

     // Compound inflation across all years
     let inflationFactor = 1;
     for (const year of relevantYears) {
          const rate = inflationRates[year];
          inflationFactor *= 1 + rate / 100;
     }
     // Calculate adjusted value
     const valueInFromYear = amount / inflationFactor;
     const totalInflationPercent = (inflationFactor - 1) * 100;

     const result = {
          valueInFromYear: Math.round(valueInFromYear * 100) / 100,
          totalInflation: Math.round(totalInflationPercent * 100) / 100,
          moneyLost: Math.round((amount - valueInFromYear) * 100) / 100,
     };

     // Store calculation in MongoDB
     await InflationApiCalculation.create({
          userId: userId,
          fromYear,
          toYear,
          amount,
          valueInFromYear: result.valueInFromYear,
          totalInflation: result.totalInflation,
          countryCode: 'GB',
          dataSource: 'World Bank API',
          isDeleted: false,
     });

     return result;
};

export const CalculatorService = {
     getSavingCalculatorFromDB,
     loanRepaymentCalculatorFromDB,
     inflationCalculatorFromDB,
     inflationCalculatorFromAPI,
};
