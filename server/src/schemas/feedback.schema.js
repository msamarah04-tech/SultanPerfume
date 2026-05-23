import { z } from 'zod';

// Photo-first feedback: a photo URL/data-URL is the primary content.
// Customer name, rating, and message are all optional captions.
export const createFeedbackSchema = z.object({
  customerName: z.string().default(''),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  message: z.string().default(''),
  imageUrl: z.string().min(1, 'صورة مطلوبة'),
  approved: z.boolean().optional(),
});

export const patchFeedbackSchema = z.object({
  approved: z.boolean(),
});
