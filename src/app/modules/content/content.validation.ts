import { z } from 'zod';

const createContentZodSchema = z.object({
     body: z.object({
          title: z.string({ required_error: 'Title is required' }).min(2),
          duration: z.string().optional(),
          videoUrl: z.string({ required_error: 'Video URL is required' }),
          views: z.number().optional(),
          category: z.string(),
     }),
});

const updateContentZodSchema = z.object({
     body: z.object({
          category: z.string().optional(),
          title: z.string().optional(),
          duration: z.string().optional(),
          videoUrl: z.string().optional(),
          views: z.number().optional(),
     }),
});
const updateContentViewsZodSchema = z.object({
     body: z.object({
          view: z.number().optional(),
     }),
});

export const ContentValidation = {
     createContentZodSchema,
     updateContentZodSchema,
     updateContentViewsZodSchema,
};
