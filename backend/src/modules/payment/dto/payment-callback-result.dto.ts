import { ApiProperty } from '@nestjs/swagger';

/**
 * Result of payment callback processing
 * Used internally to communicate between PaymentService and OrderService
 */
export class PaymentCallbackResultDto {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'order-abc-123' })
    orderId: string;

    @ApiProperty({ example: 'ORD-20260206-0001' })
    orderCode: string;

    @ApiProperty({ example: 'txn-abc-123' })
    transactionId: string;

    @ApiProperty({ example: 500000 })
    amount: number;

    @ApiProperty({ example: 'Payment successful' })
    message: string;

    @ApiProperty({
        example: { vnp_ResponseCode: '00', vnp_TransactionNo: '123456' },
        required: false,
    })
    metadata?: Record<string, any>;
}
