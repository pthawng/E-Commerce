import { z } from 'zod';

/**
 * Pagination Schema V1
 * Supports both Offset and Cursor based pagination
 */
export const PaginationSchemaV1 = z.object({
  page: z.preprocess((val) => Number(val), z.number().int().min(1).default(1)),
  limit: z.preprocess((val) => Number(val), z.number().int().min(1).max(100).default(20)),
  cursor: z.string().optional(),
  sort: z.string().regex(/^[a-zA-Z0-9_]+:(asc|desc)$/).optional(),
});

export type PaginationParamsV1 = z.infer<typeof PaginationSchemaV1>;
