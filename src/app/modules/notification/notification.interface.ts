import { Types } from 'mongoose';

export interface INotification {
  _id?: Types.ObjectId;   // MongoDB document ID
  title?: string;         // Notification title (optional)
  message: string;        // Main message (required)
  receiver: Types.ObjectId; // Linked User
  read: boolean;          // Read/unread flag
  type: 'ADMIN' | 'SYSTEM' | 'PAYMENT' | 'ALERT' | 'APPOINTMENT' | 'CANCELLED'; // Notification type
  createdAt?: Date;       // Auto-added by timestamps
  updatedAt?: Date;       // Auto-added by timestamps
}
