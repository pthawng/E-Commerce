import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Email đăng ký',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({
    description: 'Mật khẩu (>= 6 ký tự)',
    example: 'Abc12345',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải >= 6 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Mật khẩu phải chứa chữ hoa, chữ thường và số',
  })
  password: string;

  @ApiProperty({
    description: 'Tên đầy đủ người dùng',
    example: 'Nguyễn Văn A',
    required: false,
  })
  @IsNotEmpty()
  @IsString()
  fullName: string;
}
