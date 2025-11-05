import { Schema, model } from 'mongoose';
import { ISavingGoal } from './savingGole.interface';

// Helper function for completion calculation
function calculateCompletion(savedMoney: number, totalAmount: number) {
  const completionRation =
    totalAmount && totalAmount > 0
      ? Math.min((savedMoney / totalAmount) * 100, 100)
      : 0;
  const isCompleted = savedMoney >= totalAmount;
  return { completionRation, isCompleted };
}

const savingGoalSchema = new Schema<ISavingGoal>(
  {
    name: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    monthlyTarget: { type: Number, required: true },
    completionRation: { type: Number, default: 0 },
    savedMoney: { type: Number, default: 0 },
    date: { type: String, required: true },
    completeDate: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isCompleted: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Handle .save()
savingGoalSchema.pre('save', function (next) {
  if (this.isModified('savedMoney') || this.isNew) {
    const { completionRation, isCompleted } = calculateCompletion(
      this.savedMoney,
      this.totalAmount
    );
    this.completionRation = completionRation;
    this.isCompleted = isCompleted;
  }
  next();
});

// Handle findOneAndUpdate
savingGoalSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;
  if (!update) return next();

  const docToUpdate = await this.model.findOne(this.getQuery());
  if (!docToUpdate) return next();

  const savedMoney = update.savedMoney ?? docToUpdate.savedMoney;
  const totalAmount = update.totalAmount ?? docToUpdate.totalAmount;

  const { completionRation, isCompleted } = calculateCompletion(
    savedMoney,
    totalAmount
  );

  update.completionRation = completionRation;
  update.isCompleted = isCompleted;

  next();
});

export const SavingGoal = model<ISavingGoal>('SavingGoal', savingGoalSchema);
