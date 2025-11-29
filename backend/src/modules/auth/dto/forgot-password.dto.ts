import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiPropertyOptional({
    description: 'Email yêu cầu reset mật khẩu',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Số điện thoại yêu cầu reset mật khẩu',
    example: '0912345678',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
