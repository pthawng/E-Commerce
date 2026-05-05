import { z } from 'zod';

export const ProductEmbeddingSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
  name: z.string().min(1, 'name is required').max(500),
  description: z.string().max(5000).optional(),
  category: z.string().max(200).optional(),
  slug: z.string().max(300).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  price: z.number().nonnegative().optional(),
  locale: z.string().max(10).optional(),
  updatedAt: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const RecommendationQuerySchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  limit: z.coerce.number().int().min(1).max(50).default(5),
});

export type ValidatedEmbeddingPayload = z.infer<typeof ProductEmbeddingSchema>;
export type ValidatedRecommendationQuery = z.infer<typeof RecommendationQuerySchema>;
