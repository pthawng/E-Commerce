import { ApiProperty } from '@nestjs/swagger';

/**
 * Order summary in response
 */
export class OrderSummaryDto {
    @ApiProperty({ example: 'abc-123-def-456' })
    id: string;

    @ApiProperty({ example: 'ORD-20260206-0001' })
    code: string;

    @ApiProperty({
        enum: ['pending_payment', 'confirmed', 'cancelled'],
        example: 'pending_payment',
    })
    status: string;

    @ApiProperty({
        enum: ['unpaid', 'paid'],
        example: 'unpaid',
    })
    paymentStatus: string;

    @ApiProperty({
        example: '2026-02-06T16:15:00Z',
        description: 'Payment deadline (15 min from creation)',
        nullable: true,
    })
    paymentDeadline: Date | null;

    @ApiProperty({ example: 500000 })
    totalAmount: number;

    @ApiProperty({ example: 'VND' })
    currency: string;

    @ApiProperty({ example: '2026-02-06T16:00:00Z' })
    createdAt: Date;
}

/**
 * Payment details in response
 */
export class PaymentDetailsDto {
    @ApiProperty({ example: 'txn-abc-123' })
    id: string;

    @ApiProperty({
        example: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...',
        description: 'Payment URL to redirect user (null for COD)',
        nullable: true,
    })
    paymentUrl: string | null;

    @ApiProperty({ example: 'TXN-20260206-0001', nullable: true })
    transactionCode: string | null;

    @ApiProperty({
        enum: ['COD', 'VNPAY', 'PAYPAL'],
        example: 'VNPAY',
    })
    provider: string;

    @ApiProperty({
        enum: ['pending', 'success'],
        example: 'pending',
    })
    status: string;
}

/**
 * Main response DTO for order creation with payment
 */
export class OrderPaymentResponseDto {
    @ApiProperty({ type: OrderSummaryDto })
    order: OrderSummaryDto;

    @ApiProperty({ type: PaymentDetailsDto })
    payment: PaymentDetailsDto;

    @ApiProperty({
        enum: ['pending_payment', 'confirmed', 'failed'],
        example: 'pending_payment',
        description: 'Overall flow status',
    })
    flowStatus: 'pending_payment' | 'confirmed' | 'failed';

    @ApiProperty({
        example:
            'Order created successfully. Please complete payment within 15 minutes.',
    })
    message: string;
}
