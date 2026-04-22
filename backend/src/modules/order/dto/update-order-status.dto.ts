import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatusEnum } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatusEnum })
  @IsEnum(OrderStatusEnum)
  status: OrderStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
