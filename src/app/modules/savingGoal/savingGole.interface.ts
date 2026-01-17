import { Types } from 'mongoose';

export interface ISavingGoal {
     name: string;
     totalAmount: number;
     monthlyTarget: number;
     completionRation:number;
     savedMoney:number;
     isCompleted: boolean;
     date: Date;
     completeDate: Date;
     userId: Types.ObjectId;
     isDeleted: boolean;
}
