import { z } from 'zod';

const sizeSchema = z.object({
  size: z.string().min(1),
  price: z.number().min(0),
});

export const createProductSchema = z.object({
  id: z.string().regex(/^p\d{3,}$/).optional(),
  name: z.string().min(1),
  nameAr: z.string().default(''),
  brand: z.string().default(''),
  description: z.string().default(''),
  category: z.enum(['unisex', 'women', 'men']).default('unisex'),
  sizes: z.array(sizeSchema).min(1),
  stock: z.number().int().min(0).default(0),
  topNotes: z.string().default(''),
  heartNotes: z.string().default(''),
  baseNotes: z.string().default(''),
  images: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema;

export const patchProductSchema = createProductSchema.partial();
