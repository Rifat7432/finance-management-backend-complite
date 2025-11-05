import { JwtPayload } from 'jsonwebtoken';
import { INotification } from './notification.interface';
import { Notification } from './notification.model';


// ✅ Get notifications for logged-in user
const getNotificationFromDB = async (user: JwtPayload): Promise<{ result: INotification[]; unreadCount: number }> => {
  const result = await Notification.find({ receiver: user.id }).sort({ createdAt: -1 });

  const unreadCount = await Notification.countDocuments({
    receiver: user.id,
    read: false,
  });

  return { result, unreadCount };
};

// ✅ Mark all notifications as read for user
const readNotificationToDB = async (user: JwtPayload): Promise<{ modifiedCount: number }> => {
  const result = await Notification.updateMany(
    { receiver: user.id, read: false },
    { $set: { read: true } }
  );

  return { modifiedCount: result.modifiedCount };
};


export const NotificationService = {
  getNotificationFromDB,
  readNotificationToDB,
};
