import { z } from 'zod';

export const SubscriptionValidation = {
  createSubscriptionZodSchema: z.object({
    body: z.object({
      subscriptionId: z.string().nonempty('Subscription ID is required'),
      productId: z.string().nonempty('Product ID is required'),
      purchaseToken: z.string().nonempty('Purchase token is required'),
    }),
  }),
};
