import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class UpdatePricingFormulaDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  materialCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  laborCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  marginMultiplier?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  boutiqueCoefficient?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
