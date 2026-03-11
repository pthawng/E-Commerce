import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class TransferStockDto {
  @IsString()
  variantId: string;

  @IsString()
  fromWarehouseId: string;

  @IsString()
  toWarehouseId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  note?: string;
}
