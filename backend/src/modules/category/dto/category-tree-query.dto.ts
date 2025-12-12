import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Query DTO để lấy tree categories.
 */
export class CategoryTreeQueryDto {
  @ApiPropertyOptional({
    description: 'Bao gồm danh mục inactive',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeInactive phải là boolean' })
  includeInactive?: boolean;
}
