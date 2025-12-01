import { Public } from '@common/decorators/public.decorator';
import { AuthService } from '@modules/auth/auth.service';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { RefreshTokenDto } from '@modules/auth/dto/refresh-token.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { VerifyEmailDto } from '@modules/auth/dto/verify-email.dto';
import { JwtRefreshGuard } from '@modules/auth/guard/refresh-jwt.guard';
import { VerifyEmailService } from '@modules/auth/services/verify-email.auth.service';
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly verifyEmailService: VerifyEmailService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiCreatedResponse({ description: 'Đăng ký thành công' })
  @ApiBadRequestResponse({ description: 'Email đã tồn tại hoặc dữ liệu không hợp lệ' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiOkResponse({ description: 'Đăng nhập thành công' })
  @ApiUnauthorizedResponse({ description: 'Thông tin đăng nhập không đúng' })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token' })
  @ApiOkResponse({ description: 'Làm mới token thành công' })
  @ApiUnauthorizedResponse({ description: 'Refresh token không hợp lệ hoặc đã hết hạn' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác minh email' })
  @ApiOkResponse({ description: 'Xác minh email thành công' })
  @ApiBadRequestResponse({ description: 'Token không hợp lệ hoặc đã hết hạn' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.verifyEmailService.verifyToken(dto);
  }
}
