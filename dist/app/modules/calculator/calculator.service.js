"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculatorService = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
function getSavingCalculatorFromDB(payload) {
    return __awaiter(this, void 0, void 0, function* () {
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
        return {
            totalSavedBeforeTax: Number(futureValue.toFixed(2)),
            afterTax: Number(afterTaxValue.toFixed(2)),
            inflationAdjustedValue: Number(inflationAdjusted.toFixed(2)),
            netGain: Number(netGain.toFixed(2)),
        };
    });
}
const loanRepaymentCalculatorFromDB = (payload) => {
    const { principal, loanTermYears, annualInterestRate } = payload;
    const monthlyInterestRate = annualInterestRate / 100 / 12;
    const totalPayments = loanTermYears * 12;
    let monthlyPayment;
    if (monthlyInterestRate === 0) {
        monthlyPayment = principal / totalPayments;
    }
    else {
        monthlyPayment = (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPayments)) / (Math.pow(1 + monthlyInterestRate, totalPayments) - 1);
    }
    const totalPayableAmount = monthlyPayment * totalPayments;
    return {
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        totalPayableAmount: Math.round(totalPayableAmount * 100) / 100,
    };
};
const inflationCalculatorFromDB = (payload) => {
    const { initialAmount, annualInflationRate, years } = payload;
    const rateDecimal = annualInflationRate / 100;
    const futureValue = initialAmount * Math.pow(1 + rateDecimal, years);
    return {
        futureValue: Math.round(futureValue * 100) / 100,
    };
};
const inflationCalculatorFromAPI = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { fromYear, toYear, amount } = payload;
    const url = `https://api.worldbank.org/v2/country/GB/indicator/FP.CPI.TOTL.ZG?format=json&per_page=1000`;
    const response = yield (0, node_fetch_1.default)(url);
    if (!response.ok)
        throw new Error('Failed to fetch inflation data from World Bank');
    const data = yield response.json();
    if (!Array.isArray(data) || !data[1])
        throw new Error('Invalid API response format');
    // Extract annual inflation rates (%)
    const inflationRates = {};
    for (const entry of data[1]) {
        const year = parseInt(entry.date);
        const value = parseFloat(entry.value);
        if (!isNaN(year) && !isNaN(value))
            inflationRates[year] = value;
    }
    // Ensure valid years
    if (fromYear >= toYear)
        throw new Error('From year must be less than To year');
    const relevantYears = Object.keys(inflationRates)
        .map(Number)
        .filter((y) => y > fromYear && y <= toYear)
        .sort((a, b) => a - b);
    if (relevantYears.length === 0)
        throw new Error(`No inflation data found between ${fromYear} and ${toYear}`);
    // Compound inflation across all years
    let inflationFactor = 1;
    for (const year of relevantYears) {
        const rate = inflationRates[year];
        inflationFactor *= 1 + rate / 100;
    }
    // Calculate adjusted value
    const valueInFromYear = amount / inflationFactor;
    const totalInflationPercent = (inflationFactor - 1) * 100;
    return {
        valueInFromYear: Math.round(valueInFromYear * 100) / 100,
        totalInflation: Math.round(totalInflationPercent * 100) / 100,
    };
});
exports.CalculatorService = {
    getSavingCalculatorFromDB,
    loanRepaymentCalculatorFromDB,
    inflationCalculatorFromDB,
    inflationCalculatorFromAPI,
};
