import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateProfileDto {
    @ApiProperty({ example: 'John Doe', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    fullName?: string;

    @ApiProperty({ example: 'johnny', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    nickName?: string;

    @ApiProperty({ example: '0123456789', required: false })
    @IsOptional()
    @IsString()
    @Matches(/^[0-9+]{8,15}$/, { message: 'Phone number is invalid' })
    phone?: string;

    @ApiProperty({ example: 'user@example.com', required: false })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ example: 'I am a staff engineer', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    bio?: string;

    @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
    @IsOptional()
    @IsString()
    avatarUrl?: string;
}
