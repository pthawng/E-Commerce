import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, ValidateIf } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({
    description: 'Email đăng nhập (bắt buộc nếu không có phone)',
    example: 'example@gmail.com',
  })
  @ValidateIf((o) => !o.phone)
  @IsNotEmpty({ message: 'Email hoặc phone bắt buộc phải có' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Số điện thoại đăng nhập (bắt buộc nếu không có email)',
    example: '0912345678',
  })
  @ValidateIf((o) => !o.email)
  @IsNotEmpty({ message: 'Email hoặc phone bắt buộc phải có' })
  @IsString({ message: 'Phone phải là chuỗi' })
  phone?: string;

  @ApiProperty({
    description: 'Mật khẩu đăng nhập (tối thiểu 6 ký tự)',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;
}
