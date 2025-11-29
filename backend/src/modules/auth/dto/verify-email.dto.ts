import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'ID của người dùng',
    example: 'a4f6e3e6-29cd-4d8a-b444-ffe08c58997a',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Mã xác minh (OTP hoặc token)',
    example: '483920',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
