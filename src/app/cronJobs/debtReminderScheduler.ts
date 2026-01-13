import cron from 'node-cron';
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
function addOneMonth(dateStr: string): string {
     const date = new Date(dateStr); // YYYY-MM-DD
     const year = date.getFullYear();
     const month = date.getMonth();
     const day = date.getDate();

     // Create new date +1 month
     const nextDate = new Date(year, month + 1, day);

     // Format YYYY-MM-DD
     const yyyy = nextDate.getFullYear();
     const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
     const dd = String(nextDate.getDate()).padStart(2, '0');

     return `${yyyy}-${mm}-${dd}`;
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

cron.schedule('0 0 * * *', async () => {
     const now = new Date();
     // Get the UTC offset of Europe/London at this moment
     const ukOffsetMinutes = now.getTimezoneOffset() - new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' })).getTimezoneOffset();
     // Calculate current UK time as a Date object
     const nowUK = new Date(now.getTime() - ukOffsetMinutes * 60 * 1000);

     try {
          const today = new Date()
               .toLocaleDateString('en-GB', {
                    timeZone: 'Europe/London',
               })
               .split('/')
               .reverse()
               .join('-');
          const debts = await Debt.find({
               isDeleted: false,
               completionRatio: { $lt: 100 },
               payDueDate: today,
          });

          for (const debt of debts) {
               const userSetting: any = await NotificationSettings.findOne({ userId: debt.userId }).lean();
               if (!userSetting?.debtNotification) continue;

               const timeZone = userSetting.timeZone || 'Europe/London';
               const debtUTC = getDebtUTC(debt.payDueDate, '08:00', timeZone);
               const diffHours = (debtUTC.getTime() - nowUK.getTime()) / (1000 * 60 * 60);

               if (diffHours >= 23.9 && diffHours <= 24.1) {
                    await sendDebtNotification({ userSetting, userId: debt.userId, debt });
                    console.log(`✅ Debt reminder sent: ${debt.name}`);
               }

               const totalToDeduct = (debt.monthlyPayment || 0) + (debt.AdHocPayment || 0) + (debt.capitalRepayment || 0) + (debt.interestRepayment || 0);

               const newAmount = Math.max(debt.amount - totalToDeduct, 0);

               const completionRatio = debt.amount > 0 ? Number((((debt.amount - newAmount) / debt.amount) * 100).toFixed(2)) : 0;

               const nextPayDate = addOneMonth(debt.payDueDate);

               await Debt.updateOne(
                    { _id: debt._id },
                    {
                         amount: newAmount,
                         completionRatio,
                         payDueDate: nextPayDate,
                    },
               );

               console.log(`✔ Debt updated for: ${debt.name}`);
          }
     } catch (error) {
          console.error('❌ Debt completion update error:', error);
     }
},  { timezone: 'Europe/London' });
