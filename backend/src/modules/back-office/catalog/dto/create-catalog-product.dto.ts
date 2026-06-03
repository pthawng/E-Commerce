import { ProductCatalogStatus, StockStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateCatalogProductDto {
  @IsString()
  name!: string;

  @IsString()
  sku!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  collectionId!: string;

  @IsUUID()
  categoryId!: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  retailPrice!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  materialCost = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  laborCost = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  marginMultiplier = 4.2;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  boutiqueCoefficient = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock = 0;

  @IsOptional()
  @IsEnum(StockStatus)
  stockStatus?: StockStatus;

  @IsOptional()
  @IsEnum(ProductCatalogStatus)
  status?: ProductCatalogStatus;

  @IsOptional()
  @IsString()
  certificate?: string;

  @IsOptional()
  @IsString()
  certificateAuthority?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsBoolean()
  preorderEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pricingApproved?: boolean;
}
