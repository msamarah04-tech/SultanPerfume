import { z } from 'zod';

// Jordan mobile: 07[7-9] + 7 digits. Accepts +962 / 962 / 0 prefixes.
const JO_PHONE = /^(\+?962|0)?7[789]\d{7}$/;

const orderItemSchema = z.object({
  productId: z.string(),
  size: z.string().min(1),
  quantity: z.number().int().min(1),
});

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(2, 'الاسم مطلوب'),
    phone: z.string().refine(
      v => JO_PHONE.test(v.replace(/\s/g, '')),
      'رقم هاتف أردني غير صحيح'
    ),
    address: z.string().min(10, 'العنوان مطلوب'),
    notes: z.string().default(''),
  }),
  items: z.array(orderItemSchema).min(1, 'الطلب فارغ'),
  // Optional. If present, server re-validates against the offers table
  // and applies the discount; client-computed discount is never trusted.
  promoCode: z.string().trim().max(64).optional().nullable(),
});

// Same payload as createOrder but without customer details — used by
// /orders/preview to compute totals as the user fills the cart/checkout.
export const previewOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'الطلب فارغ'),
  promoCode: z.string().trim().max(64).optional().nullable(),
});

export const patchOrderSchema = z.object({
  status: z.enum(['new', 'contacted', 'confirmed', 'fulfilled', 'cancelled']).optional(),
  whatsappSent: z.boolean().optional(),
});
