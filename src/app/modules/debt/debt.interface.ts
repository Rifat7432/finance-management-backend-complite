import { Types } from "mongoose";

export interface IDebt {
  name: string;
  amount: number;
  monthlyPayment: number;
  AdHocPayment: number;
  capitalRepayment: number;
  interestRepayment: number;
  payDueDate: string;
  userId: Types.ObjectId;
  isDeleted:boolean;
}