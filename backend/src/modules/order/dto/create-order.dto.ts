import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsEmail,
    IsIn,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsPhoneNumber,
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
    @IsPhoneNumber('VN')
    phone: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    addressLine: string; // Street address

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    ward: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    district: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    province: string;
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
        default: false
    })
    @IsOptional()
    @IsBoolean()
    confirmPriceChange?: boolean;

    @ApiPropertyOptional({ description: 'Idempotency key to prevent duplicate orders' })
    @IsOptional()
    @IsString()
    idempotencyKey?: string;
}
