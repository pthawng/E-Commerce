import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class PaginationDto {
  /**
   * Page number (Offset mode)
   */
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsInt()
  @Min(1)
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
   * Base64 encoded cursor (Cursor mode)
   */
  @IsOptional()
  @IsString()
  cursor?: string;
}
