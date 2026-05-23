import { CurrentUserId } from '@common/decorators/get-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { AuthService } from '@modules/auth/auth.service';
import { ChangePasswordDto } from '@modules/auth/dto/change-password.dto';
import { ForgotPasswordDto } from '@modules/auth/dto/forgot-password.dto';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { LogoutDto } from '@modules/auth/dto/logout.dto';
import { RefreshTokenDto } from '@modules/auth/dto/refresh-token.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { ResendVerifyEmailDto } from '@modules/auth/dto/resend-verify-email.dto';
import { ResetPasswordDto } from '@modules/auth/dto/reset-password.dto';
import { VerifyEmailDto } from '@modules/auth/dto/verify-email.dto';
import { JwtAccessGuard } from '@modules/auth/guard/access-jwt.guard';
import { JwtRefreshGuard } from '@modules/auth/guard/refresh-jwt.guard';
import { VerifyEmailService } from '@modules/auth/services/verify-email.auth.service';
import { PermissionCacheService } from '@modules/rbac/cache/permission-cache.service';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';

import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { clearAuthCookies, setAuthCookies } from './utils/auth-cookie.helper';

/**
 * Authentication controller.
 * Exposes endpoints for user registration, login, logout, and session management.
 */
@ApiTags('Authentication')
@Throttle({ strict: { limit: 5, ttl: 60000 } })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly verifyEmailService: VerifyEmailService,
    private readonly permissionCacheService: PermissionCacheService,
  ) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiCreatedResponse({ description: 'Đăng ký thành công' })
  @ApiBadRequestResponse({ description: 'Email đã tồn tại hoặc dữ liệu không hợp lệ' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip;
    const ua = req.headers['user-agent'] as string | undefined;
    const result = await this.authService.register(dto, ip, ua);
    setAuthCookies(req, res, result.tokens);
    return result;
  }

  @UseGuards(JwtAccessGuard)
  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @ApiOkResponse({ description: 'Thông tin người dùng' })
  @ApiUnauthorizedResponse({ description: 'Token không hợp lệ' })
  async getMe(@CurrentUserId() userId: string) {
    return this.authService.getMe(userId);
  }

  @UseGuards(JwtAccessGuard)
  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  @ApiOkResponse({ description: 'Cập nhật thành công' })
  async updateMe(
    @CurrentUserId() userId: string,
    @Body() dto: import('@modules/auth/dto/update-me.dto').UpdateMeDto,
  ) {
    return this.authService.updateMe(userId, dto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiOkResponse({ description: 'Đăng nhập thành công' })
  @ApiUnauthorizedResponse({ description: 'Thông tin đăng nhập không đúng' })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    setAuthCookies(req, res, result.tokens);
    return result;
  }

  @Public()
  @UseGuards(ThrottlerGuard)
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
  @UseGuards(ThrottlerGuard)
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
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip;
    const ua = req.headers['user-agent'] as string | undefined;

    // Support refresh tokens from either request body or HTTP-only cookies
    // Use the token from request body if available, otherwise fallback to cookies
    const token = dto.refreshToken || (req.user as any)?.refreshToken;

    if (!token) {
      throw new BadRequestException('Refresh token is required via cookie or body');
    }

    const result = await this.authService.refreshToken({ refreshToken: token }, ip, ua);
    setAuthCookies(req, res, result.tokens);
    return result;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất (Thu hồi refresh token)' })
  @ApiOkResponse({ description: 'Đăng xuất thành công' })
  async logout(@Body() dto: LogoutDto, @Res({ passthrough: true }) res: Response) {
    clearAuthCookies(res);
    return this.authService.logout(dto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác minh email' })
  @ApiOkResponse({ description: 'Xác minh email thành công' })
  @ApiBadRequestResponse({ description: 'Token không hợp lệ hoặc đã hết hạn' })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ua = req.headers['user-agent'] as string | undefined;
    const ip = req.ip;

    const result = await this.verifyEmailService.verifyToken(dto, ip, ua);

    // Auto-login security logic applied
    if (result.auth) {
      setAuthCookies(req, res, result.auth.tokens);
    }

    return result;
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('resend-verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gửi lại email xác thực' })
  @ApiOkResponse({ description: 'Đã gửi yêu cầu' })
  async resendVerifyEmail(@Body() dto: ResendVerifyEmailDto, @Req() req: Request) {
    const ua = req.headers['user-agent'] as string | undefined;
    const ip = req.ip;

    await this.verifyEmailService.resendVerification(dto.email, ip, ua);
    // Always return the same success message regardless of whether the email exists
    return {
      success: true,
      message: 'Nếu email tồn tại trong hệ thống, link kích hoạt đã được gửi tới hòm thư của bạn.',
    };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiOkResponse({ description: 'Đổi mật khẩu thành công' })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ hoặc mật khẩu hiện tại không đúng' })
  async changePassword(@CurrentUserId() userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto);
  }

  async getPermissions(@CurrentUserId() userId: string) {
    return this.permissionCacheService.getPermissions(userId);
  }

  @UseGuards(JwtAccessGuard)
  @Get('sessions')
  @ApiOperation({ summary: 'Lấy tất cả phiên đăng nhập đang hoạt động' })
  @ApiOkResponse({ description: 'Danh sách phiên đăng nhập' })
  async getSessions(@CurrentUserId() userId: string) {
    return this.authService.getSessions(userId);
  }

  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Thu hồi một phiên đăng nhập' })
  @ApiOkResponse({ description: 'Thu hồi thành công' })
  async revokeSession(@CurrentUserId() userId: string, @Param('id') jti: string) {
    return this.authService.revokeSession(userId, jti);
  }
}
