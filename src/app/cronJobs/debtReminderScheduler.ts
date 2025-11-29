import cron from 'node-cron';
import { Types } from 'mongoose';
import { Debt } from '../modules/debt/debt.model';
import { NotificationSettings } from '../modules/notificationSettings/notificationSettings.model';
import { Notification } from '../modules/notification/notification.model';
import { firebaseHelper } from '../../helpers/firebaseHelper';

function getDebtUTC(date: string | Date, time: string, timeZone?: string): Date {
     const tz = timeZone || 'Europe/London';
     const [hour, minute] = time.split(':').map(Number);
     const localDate = new Date(date);
     localDate.setHours(hour, minute, 0, 0);
     const localString = localDate.toLocaleString('en-GB', { timeZone: tz });
     return new Date(localString);
}

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

cron.schedule('0 8 * * *', async () => {
// cron.schedule('*/10 * * * * *', async () => {
     try {
          const now = new Date();
          const debts = await Debt.find({ isDeleted: false }).lean();

          for (const debt of debts) {
               const userSetting: any = await NotificationSettings.findOne({ userId: debt.userId }).lean();
               if (!userSetting?.debtNotification) continue;

               const timeZone = userSetting.timeZone || 'Europe/London';
               const debtUTC = getDebtUTC(debt.payDueDate, '08:00', timeZone);
               const diffHours = (debtUTC.getTime() - now.getTime()) / (1000 * 60 * 60);

               // Send 24 hours before
               if (diffHours >= 23.9 && diffHours <= 24.1) {
                    await sendDebtNotification({ userSetting, userId: debt.userId, debt });
                    console.log(`✅ Debt reminder sent: ${debt.name}`);
               }
          }
     } catch (err) {
          console.error('❌ Debt reminder error:', err);
     }
});
