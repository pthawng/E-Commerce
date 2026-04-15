import { IsDateString, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/pagination';

export class StockQueryDto extends PaginationDto {
  @IsString()
  @IsOptional()
  variantId?: string;

  @IsString()
  @IsOptional()
  warehouseId?: string;

  @IsString()
  @IsOptional()
  actionType?: string;

  @IsString()
  @IsOptional()
  referenceType?: string;

  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  toDate?: string;
}
