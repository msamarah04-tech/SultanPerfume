import { z } from 'zod';

export const updateSettingsSchema = z.object({
  deliveryFee: z.number().min(0).optional(),
  freeDeliveryThreshold: z.number().min(0).optional(),
  whatsappNumber: z.string().optional(),
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
  numeralSystem: z.enum(['arab', 'latin']).optional(),
  tagline: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
  socials: z.object({
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    snapchat: z.string().optional(),
  }).optional(),
  homeSections: z.array(z.string()).optional(),
  quantityPricing: z.object({
    enabled: z.boolean().default(false),
    tiers: z.array(z.object({
      minQty: z.number().int().min(1),
      discountPercent: z.number().min(0).max(100),
    })).default([]),
  }).optional(),
  cartQuantityTiers: z.object({
    enabled: z.boolean().default(true),
    tiers: z.array(z.object({
      minQty: z.number().int().min(1),
      totalPrice: z.number().min(0),
    })).default([]),
    // Per-bottle JOD rate for excess beyond the highest tier minQty.
    excessUnitPrice: z.number().min(0).default(5),
  }).optional(),
}).strict();

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
