import { Transform } from 'class-transformer';
import { IsISO8601, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class PaginationDto {
  /**
   * Page number (Offset mode).
   * Deliberately capped at 500 to prevent deep-offset abuse.
   * For navigation beyond page 500, use cursor-based pagination.
   */
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  @Max(500)
  page?: number = 1;

  /**
   * Items per page
   */
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  /**
   * Sort format: field:direction (e.g. price:desc)
   */
  @IsOptional()
  @Matches(/^[a-zA-Z0-9_]+:(asc|desc)$/, {
    message: 'Sort must be in format field:asc or field:desc',
  })
  sort?: string;

  /**
   * Base64 encoded signed cursor (Cursor mode).
   * Opaque — do not construct manually.
   */
  @IsOptional()
  @IsString()
  cursor?: string;

  /**
   * ISO 8601 timestamp for snapshot consistency.
   * Server clamps: must be within [now-24h, now].
   * On first page, server generates this; pass it back on subsequent pages
   * to get stable results across writes.
   */
  @IsOptional()
  @IsISO8601({ strict: true })
  snapshot_at?: string;
}
