import { Types } from 'mongoose';

export interface IAd {
     _id?: Types.ObjectId;
     name: string;
     startDate: Date;
     endDate: Date;
     url: string;
     category: string;
     isDeleted?: boolean;
}
