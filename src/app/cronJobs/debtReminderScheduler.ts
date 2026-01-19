import cron from 'node-cron';
import { Debt } from '../modules/debt/debt.model';
import { NotificationSettings } from '../modules/notificationSettings/notificationSettings.model';
import { Notification } from '../modules/notification/notification.model';
import { firebaseHelper } from '../../helpers/firebaseHelper';
import { getCurrentUTC, getEndOfTodayUTC, getStartOfTodayUTC, toUTC } from '../../utils/dateTimeHelper';
import { addMonths } from 'date-fns/addMonths';

async function sendDebtNotification({ userSetting, userId, debt }: any) {
     const title = 'Debt Payment Reminder';
     const message = `Your debt "${debt.name}" of amount ${debt.amount} is due on ${new Date(debt.payDueDate).toDateString()}.`;

     if (userSetting.deviceTokenList?.length > 0) {
          await firebaseHelper.sendNotification([{ id: String(userId), deviceToken: userSetting.deviceTokenList[0] }], { title, body: message }, userSetting.deviceTokenList, 'multiple', {
               debtId: String(debt._id),
          });
     }

     await Notification.create({
          title,
          message,
          receiver: userId,
          type: 'ALERT',
          read: false,
     });
}

cron.schedule(
     '0 0 * * *',
     async () => {
          console.log('🔄 Running Debt Reminder automation (UTC time)...');
          const startOfToday = getStartOfTodayUTC();
          const endToday = getEndOfTodayUTC();
          try {
               const debts = await Debt.find({
                    isDeleted: false,
                    completionRatio: { $lt: 100 },
                    payDueDate: { $gte: startOfToday, $lte: endToday },
               });
               for (const debt of debts) {
                    const userSetting: any = await NotificationSettings.findOne({ userId: debt.userId }).lean();
                    if (userSetting?.debtNotification) {
                         await sendDebtNotification({ userSetting, userId: debt.userId, debt });
                         console.log(`✅ Debt reminder sent: ${debt.name}`);
                    }
                    const totalToDeduct = (debt.monthlyPayment || 0) + (debt.AdHocPayment || 0) + (debt.capitalRepayment || 0) + (debt.interestRepayment || 0);
                    const newAmount = Math.max(debt.amount - totalToDeduct, 0);
                    const completionRatio = debt.amount > 0 ? Number((((debt.amount - newAmount) / debt.amount) * 100).toFixed(2)) : 0;
                    const nextPayDate = addMonths(debt.payDueDate, 1);
                    await Debt.updateOne(
                         { _id: debt._id },
                         {
                              // amount: newAmount,
                              completionRatio,
                              payDueDate: nextPayDate,
                         },
                    );

                    console.log(`✔ Debt updated for: ${debt.name}`);
               }
          } catch (error) {
               console.error('❌ Debt completion update error:', error);
          }
     },
     { timezone: 'UTC' },
);
