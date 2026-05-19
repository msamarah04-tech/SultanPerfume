import { z } from 'zod';

export const createOfferSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  type: z.string().default('bundle'),
  discountPercent: z.number().int().min(0).max(100).nullable().optional(),
  discountAmount: z.number().min(0).nullable().optional(),
  promoCode: z.string().nullable().optional(),
  productIds: z.array(z.string()).default([]),
  imageUrl: z.string().default(''),
  active: z.boolean().default(true),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
});

export const updateOfferSchema = createOfferSchema;
