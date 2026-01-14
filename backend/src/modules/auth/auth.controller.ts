import { CurrentUserId } from '@common/decorators/get-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { AuthService } from '@modules/auth/auth.service';
import { ChangePasswordDto } from '@modules/auth/dto/change-password.dto';
import { ForgotPasswordDto } from '@modules/auth/dto/forgot-password.dto';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { RefreshTokenDto } from '@modules/auth/dto/refresh-token.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { ResetPasswordDto } from '@modules/auth/dto/reset-password.dto';
import { VerifyEmailDto } from '@modules/auth/dto/verify-email.dto';
import { JwtAccessGuard } from '@modules/auth/guard/access-jwt.guard';
import { JwtRefreshGuard } from '@modules/auth/guard/refresh-jwt.guard';
import { VerifyEmailService } from '@modules/auth/services/verify-email.auth.service';
import { PermissionCacheService } from '@modules/rbac/cache/permission-cache.service';
import { LogoutDto } from '@modules/auth/dto/logout.dto';

import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Query, BadRequestException } from '@nestjs/common';
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
    private readonly permissionCacheService: PermissionCacheService,
  ) { }

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
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Yêu cầu đặt lại mật khẩu' })
  @ApiOkResponse({ description: 'Nếu tài khoản tồn tại, email đặt lại sẽ được gửi.' })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Get('reset-password/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác minh reset token & lấy thông tin user' })
  @ApiOkResponse({ description: 'Token hợp lệ, trả về email/name' })
  @ApiBadRequestResponse({ description: 'Token không hợp lệ hoặc hết hạn' })
  async verifyResetToken(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }
    return this.authService.verifyResetToken(token);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt lại mật khẩu mới' })
  @ApiOkResponse({ description: 'Đặt lại mật khẩu thành công' })
  @ApiBadRequestResponse({ description: 'Token không hợp lệ hoặc hết hạn' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
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
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất (Thu hồi refresh token)' })
  @ApiOkResponse({ description: 'Đăng xuất thành công' })
  async logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto);
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

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiOkResponse({ description: 'Đổi mật khẩu thành công' })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ hoặc mật khẩu hiện tại không đúng' })
  async changePassword(@CurrentUserId() userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto);
  }

  @UseGuards(JwtAccessGuard)
  @Get('permissions')
  @ApiOperation({ summary: 'Lấy danh sách quyền của người dùng hiện tại' })
  @ApiOkResponse({ description: 'Danh sách quyền (permission action) của user' })
  async getPermissions(@CurrentUserId() userId: string) {
    return this.permissionCacheService.getPermissions(userId);
  }
}
