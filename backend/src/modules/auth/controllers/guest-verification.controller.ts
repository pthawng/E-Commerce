import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { Public } from 'src/common/decorators/public.decorator';
import { GuestVerificationService } from '../services/guest-verification.service';

class RequestOTPDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

class VerifyOTPDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}

@ApiTags('Auth')
@Controller('auth/guest')
export class GuestVerificationController {
  constructor(private readonly guestVerificationService: GuestVerificationService) {}

  @Post('verify-request')
  @Public()
  @ApiOperation({ summary: 'Request OTP for guest email verification' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async requestOTP(@Body() dto: RequestOTPDto) {
    await this.guestVerificationService.sendOTP(dto.email);
    return { message: 'Mã xác thực đã được gửi đến email của bạn.' };
  }

  @Post('verify-confirm')
  @Public()
  @ApiOperation({ summary: 'Confirm OTP and get verification token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  async verifyOTP(@Body() dto: VerifyOTPDto) {
    return this.guestVerificationService.verifyOTP(dto.email, dto.code);
  }
}
