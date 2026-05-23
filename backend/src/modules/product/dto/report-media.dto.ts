import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl, IsUUID } from 'class-validator';

export class ReportMediaDto {
  @ApiProperty({ description: 'ID của sản phẩm bị lỗi ảnh' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'URL của ảnh bị lỗi' })
  @IsUrl()
  @IsNotEmpty()
  mediaUrl: string;
}
