import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class RefundPaymentDto {
    @ApiProperty({
        description: 'Amount to refund',
        example: 100000,
    })
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    amount: number;

    @ApiProperty({
        description: 'Reason for refund',
        example: 'Customer requested refund',
        required: false,
    })
    @IsString()
    @IsOptional()
    reason?: string;

    @ApiProperty({
        description: 'Restore inventory (default: true)',
        example: true,
        required: false,
    })
    @IsOptional()
    restoreInventory?: boolean = true;
}

export class ConfirmCODPaymentDto {
    @ApiProperty({
        description: 'Order ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsNotEmpty()
    orderId: string;

    @ApiProperty({
        description: 'Amount received',
        example: 100000,
    })
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    amount: number;

    @ApiProperty({
        description: 'Note from staff',
        example: 'Payment received in cash',
        required: false,
    })
    @IsString()
    @IsOptional()
    note?: string;
}
