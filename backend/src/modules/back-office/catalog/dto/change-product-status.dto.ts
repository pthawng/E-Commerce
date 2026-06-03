import { ProductCatalogStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ChangeProductStatusDto {
  @IsEnum(ProductCatalogStatus)
  status!: ProductCatalogStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
