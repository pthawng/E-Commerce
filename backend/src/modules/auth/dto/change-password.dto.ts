import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Mật khẩu hiện tại' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ description: 'Mật khẩu mới', example: 'NewPass123' })
  @IsString()
  @MinLength(6)
  newPassword: string;

  @ApiProperty({ description: 'Xác nhận mật khẩu mới', example: 'NewPass123' })
  @IsString()
  @MinLength(6)
  confirmPassword: string;
}
