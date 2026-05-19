import { z } from 'zod';

export const createFeedbackSchema = z.object({
  customerName: z.string().min(2, 'الاسم مطلوب'),
  rating: z.number().int().min(1).max(5).optional(),
  message: z.string().min(5, 'الرسالة مطلوبة'),
});

export const patchFeedbackSchema = z.object({
  approved: z.boolean(),
});
