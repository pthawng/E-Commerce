import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';

/**
 * DTO for creating order with payment integration
 * Extends existing CreateOrderDto with payment-specific fields
 */
export class CreateOrderWithPaymentDto extends CreateOrderDto {
    // Inherited from CreateOrderDto:
    // - guestEmail?: string
    // - shippingAddress: AddressDto
    // - billingAddress?: AddressDto
    // - paymentMethod: string
    // - shippingMethodId?: string
    // - note?: string
    // - confirmPriceChange?: boolean

    @ApiProperty({
        description: 'Return URL after payment (optional, frontend can provide)',
        example: 'https://myshop.com/order/success',
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsUrl()
    returnUrl?: string;

    @ApiProperty({
        description: 'Cancel URL after payment failure (optional)',
        example: 'https://myshop.com/order/cancel',
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsUrl()
    cancelUrl?: string;
}
