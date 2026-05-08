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

export const SearchQuerySchema = z.object({
  query: z.string().trim().min(1, 'query is required').max(300),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  filters: z
    .object({
      isActive: z.boolean().optional(),
      category: z.string().trim().min(1).max(200).optional(),
      minPrice: z.number().nonnegative().optional(),
      maxPrice: z.number().nonnegative().optional(),
    })
    .optional(),
}).superRefine((value, ctx) => {
  const minPrice = value.filters?.minPrice;
  const maxPrice = value.filters?.maxPrice;

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'minPrice must be less than or equal to maxPrice',
      path: ['filters', 'minPrice'],
    });
  }
});

export const ChatRequestSchema = z.object({
  message: z.string().trim().min(1, 'message is required').max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1),
      }),
    )
    .optional(),
});


export type ValidatedEmbeddingPayload = z.infer<typeof ProductEmbeddingSchema>;

export type ValidatedRecommendationQuery = z.infer<typeof RecommendationQuerySchema>;
export type ValidatedSearchQuery = z.infer<typeof SearchQuerySchema>;
