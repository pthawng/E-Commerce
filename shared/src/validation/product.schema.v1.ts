import { z } from 'zod';
import { PaginationSchemaV1 } from './pagination.schema.v1';

/**
 * Product Query Schema V1
 * Includes search and category filtering with strict safety
 */
export const ProductQuerySchemaV1 = PaginationSchemaV1.extend({
  search: z.string().trim().min(1, 'Search term too short').max(100, 'Search term too long').optional(),
  categoryId: z.string().uuid('Invalid category ID format').optional(),
  isFeatured: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  isActive: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
});

export type ProductQueryV1 = z.infer<typeof ProductQuerySchemaV1>;
