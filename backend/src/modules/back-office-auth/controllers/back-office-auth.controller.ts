import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Request, Response } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { SkipJwtAuth } from 'src/common/decorators/skip-jwt-auth.decorator';
import { BackOfficeAuthGuard } from '../guards/back-office-auth.guard';
import { BackOfficeAuthService } from '../services/back-office-auth.service';
import { BackOfficeSessionService } from '../services/back-office-session.service';

class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

class VerifyMfaDto {
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

class MfaSetupDto {
  @IsString()
  @IsNotEmpty()
  tempToken: string;
}

@Controller('back-office/auth')
export class BackOfficeAuthController {
  constructor(
    private readonly authService: BackOfficeAuthService,
    private readonly sessionService: BackOfficeSessionService,
    private readonly configService: ConfigService,
  ) {}

  private setSessionCookie(res: Response, sessionId: string) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    res.cookie('backOfficeSessionId', sessionId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60 * 1000, // 12 hours
    });
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateCredentials(dto.email, dto.password);
    if (!user.staffProfile) {
      throw new UnauthorizedException('Tài khoản không có cấu hình nhân viên.');
    }
    const { mfaEnabled } = user.staffProfile;

    const nextStep = mfaEnabled ? 'MFA_REQUIRED' : 'MFA_SETUP_REQUIRED';
    const tempToken = await this.authService.generateMfaTempToken(
      user.id,
      mfaEnabled ? 'mfa_challenge' : 'mfa_setup',
    );

    return { nextStep, tempToken };
  }

  @Post('google')
  @Public()
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body() dto: GoogleLoginDto) {
    const user = await this.authService.validateGoogleLogin(dto.idToken);
    if (!user.staffProfile) {
      throw new UnauthorizedException('Tài khoản không có cấu hình nhân viên.');
    }
    const { mfaEnabled } = user.staffProfile;

    const nextStep = mfaEnabled ? 'MFA_REQUIRED' : 'MFA_SETUP_REQUIRED';
    const tempToken = await this.authService.generateMfaTempToken(
      user.id,
      mfaEnabled ? 'mfa_challenge' : 'mfa_setup',
    );

    return { nextStep, tempToken };
  }

  @Post('verify-mfa')
  @Public()
  @HttpCode(HttpStatus.OK)
  async verifyMfa(
    @Body() dto: VerifyMfaDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = this.authService.verifyMfaTempToken(dto.tempToken, 'mfa_challenge');
    const isValid = await this.authService.verifyMfaCode(userId, dto.code);

    if (!isValid) {
      throw new UnauthorizedException('Mã xác thực TOTP không chính xác.');
    }

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const session = await this.sessionService.createSession(userId, ipAddress, userAgent);

    this.setSessionCookie(res, session.id);

    return { success: true, message: 'Đăng nhập thành công.' };
  }

  @Post('recovery-code')
  @Public()
  @HttpCode(HttpStatus.OK)
  async verifyRecovery(
    @Body() dto: VerifyMfaDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = this.authService.verifyMfaTempToken(dto.tempToken, 'mfa_challenge');
    const isValid = await this.authService.verifyRecoveryCode(userId, dto.code);

    if (!isValid) {
      throw new UnauthorizedException('Mã khôi phục không chính xác hoặc đã được sử dụng.');
    }

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const session = await this.sessionService.createSession(userId, ipAddress, userAgent);

    this.setSessionCookie(res, session.id);

    return { success: true, message: 'Đăng nhập thành công bằng mã khôi phục.' };
  }

  @Post('logout')
  @SkipJwtAuth()
  @UseGuards(BackOfficeAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const sessionId = req.cookies ? req.cookies['backOfficeSessionId'] : undefined;
    if (sessionId) {
      await this.sessionService.revokeSession(sessionId, req.user.id);
    }
    res.clearCookie('backOfficeSessionId', { path: '/' });
    return { success: true, message: 'Đăng xuất thành công.' };
  }

  @Get('me')
  @SkipJwtAuth()
  @UseGuards(BackOfficeAuthGuard)
  async me(@Req() req: any) {
    const user = req.user;
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      userType: user.userType,
      roles: user.userRoles.map((ur: any) => ur.role.slug),
      staffProfile: {
        staffStatus: user.staffProfile.staffStatus,
        mfaEnabled: user.staffProfile.mfaEnabled,
        department: user.staffProfile.department,
      },
    };
  }

  @Post('mfa/setup')
  @Public()
  @HttpCode(HttpStatus.OK)
  async mfaSetup(@Body() dto: MfaSetupDto) {
    const userId = this.authService.verifyMfaTempToken(dto.tempToken, 'mfa_setup');
    const { qrCodeUrl, secret } = await this.authService.setupMfa(userId);
    return { qrCodeUrl, secret };
  }

  @Post('mfa/verify-setup')
  @Public()
  @HttpCode(HttpStatus.OK)
  async mfaVerifySetup(
    @Body() dto: VerifyMfaDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = this.authService.verifyMfaTempToken(dto.tempToken, 'mfa_setup');
    const recoveryCodes = await this.authService.verifyMfaSetup(userId, dto.code);

    // Create session immediately upon successful MFA setup
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const session = await this.sessionService.createSession(userId, ipAddress, userAgent);

    this.setSessionCookie(res, session.id);

    return { success: true, recoveryCodes };
  }
}
