import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutDto {
    @ApiProperty({ description: 'Refresh Token cần thu hồi', example: 'eyJ...' })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}
