import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Token xác minh email (lấy từ link ?token=...)',
    example: 'b3a1f9b09d2e4c1fa1b7c9d8e3f0a6b2',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
