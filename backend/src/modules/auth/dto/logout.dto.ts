import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({ description: 'Refresh Token cần thu hồi', example: 'eyJ...', required: false })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}
