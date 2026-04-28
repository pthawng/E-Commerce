import { Expose, Transform } from 'class-transformer';
import { Allow, IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/common/pagination';

export class ProductQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @Allow()
  @Expose()
  @IsOptional()
  @IsUUID()
  excludeCategoryId?: string;
}
