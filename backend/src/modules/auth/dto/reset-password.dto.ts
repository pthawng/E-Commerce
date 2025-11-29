import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'ID user',
    example: 'a4f6e3e6-29cd-4d8a-b444-ffe08c58997a',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Token hoặc mã reset mật khẩu',
    example: '98f3ds8f9sdf890',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Mật khẩu mới',
    example: 'NewPass123',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
