import { ProductCatalogStatus, StockStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CatalogQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  collectionId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(ProductCatalogStatus)
  status?: ProductCatalogStatus;

  @IsOptional()
  @IsEnum(StockStatus)
  stockStatus?: StockStatus;

  @IsOptional()
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value ?? 7))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 7;

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'name', 'retailPrice', 'stock', 'status'])
  sortBy: 'createdAt' | 'updatedAt' | 'name' | 'retailPrice' | 'stock' | 'status' = 'updatedAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
