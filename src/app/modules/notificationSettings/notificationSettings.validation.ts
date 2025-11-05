import { z } from 'zod';


const updateNotificationSettingsZodSchema = z.object({
  body: z.object({
    budgetNotification: z.boolean().optional(),
    contentNotification: z.boolean().optional(),
    debtNotification: z.boolean().optional(),
    dateNightNotification: z.boolean().optional(),
    appointmentNotification: z.boolean().optional(),
  }),
});

export const NotificationSettingsValidation = {
  updateNotificationSettingsZodSchema,
};
