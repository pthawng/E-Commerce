import { PaginationDto } from '@common/pagination';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TransactionQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Trạng thái giao dịch' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Cổng thanh toán (VNPAY, PAYPAL, VIETQR)' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: 'Mã đơn hàng' })
  @IsOptional()
  @IsString()
  orderCode?: string;
}
