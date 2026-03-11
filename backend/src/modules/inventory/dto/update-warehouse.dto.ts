import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class UpdateWarehouseDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsObject()
  @IsOptional()
  address?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
