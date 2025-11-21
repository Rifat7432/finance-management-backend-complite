import { Types } from "mongoose";

export interface IAd {
  _id?: Types.ObjectId;
  name: string;
  startDate: string;
  endDate: string;
  url: string;
  isDeleted?:boolean
}