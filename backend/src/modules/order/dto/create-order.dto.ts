import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class AddressDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string; // Accept any string (0901234567, +84901234567, etc.)

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  addressLine: string; // Street address

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  province?: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Customer email (if guest)' })
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @ApiProperty({ type: AddressDto })
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress: AddressDto;

  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress?: AddressDto;

  @ApiProperty({ description: 'Payment method', enum: ['VIETQR', 'VNPAY', 'PAYPAL'] })
  @IsNotEmpty()
  @IsIn(['VIETQR', 'VNPAY', 'PAYPAL'])
  paymentMethod: string;

  @ApiPropertyOptional({ description: 'Shipping method ID' })
  @IsOptional()
  @IsUUID()
  shippingMethodId?: string;

  @ApiPropertyOptional({ description: 'Order note' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'Confirm price acceptance (if DB price differs from Cart)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  confirmPriceChange?: boolean;

  @ApiPropertyOptional({ description: 'Idempotency key to prevent duplicate orders' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
