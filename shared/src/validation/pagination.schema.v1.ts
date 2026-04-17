import { z } from 'zod';

/**
 * Pagination Schema V1 — Source of Truth for API Contract
 * Supports both Offset and Cursor based pagination.
 *
 * P0-3: snapshot_at validated as ISO datetime string.
 * P1-1: page capped at 500 to prevent deep-offset abuse.
 */
export const PaginationSchemaV1 = z.object({
  page: z.preprocess((val) => Number(val), z.number().int().min(1).max(500).default(1)),
  limit: z.preprocess((val) => Number(val), z.number().int().min(1).max(100).default(20)),
  cursor: z.string().optional(),
  sort: z.string().regex(/^[a-zA-Z0-9_]+:(asc|desc)$/).optional(),
  snapshot_at: z.string().datetime({ offset: true }).optional(),
});

export type PaginationParamsV1 = z.infer<typeof PaginationSchemaV1>;
