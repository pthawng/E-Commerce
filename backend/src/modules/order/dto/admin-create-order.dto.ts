import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class AdminOrderItemDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  price: number;
}

export class AdminShippingAddressDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ward: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  detail: string;
}

export class AdminCreateOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ type: [AdminOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminOrderItemDto)
  items: AdminOrderItemDto[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shippingName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shippingPhone: string;

  @ApiProperty({ type: AdminShippingAddressDto })
  @IsObject()
  @ValidateNested()
  @Type(() => AdminShippingAddressDto)
  shippingAddress: AdminShippingAddressDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
