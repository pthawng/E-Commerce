import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsObject()
  @IsOptional()
  address?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
