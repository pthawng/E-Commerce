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
import { ResendVerifyEmailDto } from '@modules/auth/dto/resend-verify-email.dto';
import { JwtAccessGuard } from '@modules/auth/guard/access-jwt.guard';
import { JwtRefreshGuard } from '@modules/auth/guard/refresh-jwt.guard';
import { VerifyEmailService } from '@modules/auth/services/verify-email.auth.service';
import { PermissionCacheService } from '@modules/rbac/cache/permission-cache.service';
import { LogoutDto } from '@modules/auth/dto/logout.dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import { randomUUID } from 'crypto';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Query, BadRequestException, Patch, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';

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

  private setAuthCookies(req: any, res: Response, tokens: { accessToken: string; refreshToken: string }) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Rotating CSRF Token: Generate new one on each auth event
    const csrfToken = randomUUID();

    const cookieOptions = {
        secure: isProduction,
        sameSite: 'lax' as const,
        path: '/',
    };

    // 1. Access Token (HttpOnly)
    res.cookie('accessToken', tokens.accessToken, {
      ...cookieOptions,
      httpOnly: true,
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    // 2. Refresh Token (HttpOnly)
    res.cookie('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 3. CSRF Token (Double Submit Pattern)
    res.cookie('csrfToken', csrfToken, {
      ...cookieOptions,
      httpOnly: false, // Must be accessible to frontend JS to send as header
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 4. UA Binding for soft validation
    const ua = req.headers['user-agent'] || 'unknown';
    res.cookie('ua_binding', ua, {
      ...cookieOptions,
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return csrfToken;
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('csrfToken');
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiCreatedResponse({ description: 'Đăng ký thành công' })
  @ApiBadRequestResponse({ description: 'Email đã tồn tại hoặc dữ liệu không hợp lệ' })
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ip = req.ip;
    const ua = req.headers['user-agent'] as string | undefined;
    const result = await this.authService.register(dto, ip, ua);
    this.setAuthCookies(req, res, result.tokens);
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
  async updateMe(@CurrentUserId() userId: string, @Body() dto: import('@modules/auth/dto/update-me.dto').UpdateMeDto) {
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
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(req, res, result.tokens);
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
  async refreshToken(@Body() dto: RefreshTokenDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.refreshToken(dto);
    this.setAuthCookies(req, res, result.tokens);
    return result;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất (Thu hồi refresh token)' })
  @ApiOkResponse({ description: 'Đăng xuất thành công' })
  async logout(@Body() dto: LogoutDto, @Res({ passthrough: true }) res: Response) {
    this.clearAuthCookies(res);
    return this.authService.logout(dto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác minh email' })
  @ApiOkResponse({ description: 'Xác minh email thành công' })
  @ApiBadRequestResponse({ description: 'Token không hợp lệ hoặc đã hết hạn' })
  async verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ua = req.headers['user-agent'] as string | undefined;
    const ip = req.ip;

    const result = await this.verifyEmailService.verifyToken(dto, ip, ua);

    // Auto-login security logic applied
    if (result.auth) {
      this.setAuthCookies(req, res, result.auth.tokens);
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
    // Security: Luôn trả về success message giống nhau cho dù email tồn tại hay không
    return { success: true, message: 'Nếu email tồn tại trong hệ thống, link kích hoạt đã được gửi tới hòm thư của bạn.' };
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
