import { Types } from "mongoose";

export interface IAppointment {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  attendant: string;
  isChild: boolean;
  approxIncome: number;
  investment: number;
  discuss?: string;
  reachingFor: string;
  ask: string;
  date: string;
  timeSlot: string;
  userId: Types.ObjectId;
  status?:"pending" | "complete"
}