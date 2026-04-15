import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ReceiveStockDto {
  @IsString()
  variantId: string;

  @IsString()
  warehouseId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  note?: string;
}
