import { IsInt, IsString, Min } from 'class-validator';

export class AdjustStockDto {
  @IsString()
  variantId: string;

  @IsString()
  warehouseId: string;

  @IsInt()
  @Min(0)
  newQuantity: number;

  @IsString()
  reason: string;

  @IsInt()
  @Min(0)
  quantity?: number;
}
