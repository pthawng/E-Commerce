import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaymentMethodEnum } from '../types/payment.types';

export class CreatePaymentDto {
    @ApiProperty({
        description: 'Order ID to create payment for',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsNotEmpty()
    orderId: string;

    @ApiProperty({
        description: 'Payment method',
        enum: PaymentMethodEnum,
        example: PaymentMethodEnum.VNPAY,
    })
    @IsEnum(PaymentMethodEnum)
    @IsNotEmpty()
    paymentMethod: PaymentMethodEnum;

    @ApiProperty({
        description: 'Return URL after payment (for redirect-based payments)',
        example: 'http://localhost:5173/payment/success',
        required: false,
    })
    @IsString()
    @IsOptional()
    returnUrl?: string;

    @ApiProperty({
        description: 'Cancel URL if payment is cancelled',
        example: 'http://localhost:5173/payment/cancel',
        required: false,
    })
    @IsString()
    @IsOptional()
    cancelUrl?: string;

    @ApiProperty({
        description: 'Customer IP address',
        example: '192.168.1.1',
        required: false,
    })
    @IsString()
    @IsOptional()
    ipAddr?: string;

    @ApiProperty({
        description: 'Bank code for VNPAY (optional)',
        example: 'NCB',
        required: false,
    })
    @IsString()
    @IsOptional()
    bankCode?: string;
}
