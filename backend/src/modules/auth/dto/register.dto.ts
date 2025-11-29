import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Email đăng ký',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({
    description: 'Mật khẩu (>= 6 ký tự)',
    example: 'Abc12345',
  })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải >= 6 ký tự' })
  password: string;

  @ApiProperty({
    description: 'Tên đầy đủ người dùng',
    example: 'Nguyễn Văn A',
    required: false,
  })
  @IsString()
  fullName?: string;
}
