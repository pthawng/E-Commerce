import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * VNPAY Callback DTO
 * Validates parameters from VNPAY IPN callback
 */
export class VNPayCallbackDto {
    @ApiProperty({ description: 'VNPAY transaction reference' })
    @IsString()
    @IsNotEmpty()
    vnp_TxnRef: string;

    @ApiProperty({ description: 'Amount (in smallest unit)' })
    @IsString()
    @IsNotEmpty()
    vnp_Amount: string;

    @ApiProperty({ description: 'Order info' })
    @IsString()
    @IsNotEmpty()
    vnp_OrderInfo: string;

    @ApiProperty({ description: 'Response code' })
    @IsString()
    @IsNotEmpty()
    vnp_ResponseCode: string;

    @ApiProperty({ description: 'Transaction number from VNPAY' })
    @IsString()
    @IsNotEmpty()
    vnp_TransactionNo: string;

    @ApiProperty({ description: 'Bank code' })
    @IsString()
    @IsOptional()
    vnp_BankCode?: string;

    @ApiProperty({ description: 'Card type' })
    @IsString()
    @IsOptional()
    vnp_CardType?: string;

    @ApiProperty({ description: 'Payment date' })
    @IsString()
    @IsOptional()
    vnp_PayDate?: string;

    @ApiProperty({ description: 'Secure hash' })
    @IsString()
    @IsNotEmpty()
    vnp_SecureHash: string;

    @ApiProperty({ description: 'TMN Code' })
    @IsString()
    @IsNotEmpty()
    vnp_TmnCode: string;

    @ApiProperty({ description: 'Transaction status' })
    @IsString()
    @IsOptional()
    vnp_TransactionStatus?: string;
}
