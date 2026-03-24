import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from 'src/common/pagination';

export class ProductQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
