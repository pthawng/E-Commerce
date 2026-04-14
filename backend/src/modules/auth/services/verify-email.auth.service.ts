import { VerifyEmailDto } from '@modules/auth/dto/verify-email.dto';
import { BadRequestException, Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { AuthService } from '../auth.service';
import type { AuthResponse } from '@shared';

@Injectable()
export class VerifyEmailService {
  private readonly logger = new Logger(VerifyEmailService.name);
  private readonly TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes (Strict L8 security)
  private readonly TOKEN_BYTE_LENGTH = 32;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
  ) { }

  /**
   * Generates a crytographically secure token and persists it.
   */
  async createAndSaveToken(userId: string, reqIp?: string, reqUserAgent?: string) {
    const token = randomBytes(this.TOKEN_BYTE_LENGTH).toString('hex');
    const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MS);

    await this.prisma.verifyEmailToken.create({
      data: { token, userId, expiresAt, ipAddress: reqIp, userAgent: reqUserAgent },
    });

    return token;
  }

  async sendVerifyEmail(user: { id: string; email: string; fullName: string }, reqIp?: string, reqUserAgent?: string) {
    const token = await this.createAndSaveToken(user.id, reqIp, reqUserAgent);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    // Robust URL construction
    const verificationUrl = new URL('/verify-email', frontendUrl);
    verificationUrl.searchParams.set('token', token);

    try {
      await this.mailService.sendMail({
        to: user.email,
        subject: 'Verify your email',
        template: 'verify-email',
        eventType: 'user.verify_email',
        idempotencyKey: `verify_email_${user.id}_${token.slice(0, 8)}`,
        context: {
          name: user.fullName,
          verificationUrl: verificationUrl.toString(),
          expiryMinutes: 15,
          supportEmail: this.configService.get<string>('MAIL_FROM'),
          companyName: this.configService.get<string>('COMPANY_NAME'),
        },
      });

      return true;
    } catch (error) {
      this.logger.error(`Error triggering verify email: ${error.message}`, error.stack);
      // We no longer throw here or revoke the token, as the MailService handles the persistent queueing.
      return true; 
    }
  }

  async resendVerification(email: string, reqIp?: string, reqUserAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Do not reveal email absence, just return true (L8 Security)
      return true;
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Tài khoản này đã được xác thực trước đó.');
    }

    // Clean up old tokens to prevent clutter
    await this.prisma.verifyEmailToken.deleteMany({
      where: { userId: user.id },
    });

    await this.sendVerifyEmail({
      id: user.id,
      email: user.email,
      fullName: user.fullName ?? user.email,
    }, reqIp, reqUserAgent);

    return true;
  }

  async verifyToken(dto: VerifyEmailDto, reqIp?: string, reqUserAgent?: string): Promise<{ verified: true, requireLogin: boolean, auth?: AuthResponse }> {
    const record = await this.prisma.verifyEmailToken.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (!record) throw new BadRequestException('Liên kết xác thực không hợp lệ hoặc đã được sử dụng.');

    if (record.expiresAt < new Date()) {
      await this.prisma.verifyEmailToken.delete({ where: { id: record.id } });
      throw new BadRequestException('Liên kết xác thực đã hết hạn (quá 15 phút). Vui lòng yêu cầu lại.');
    }

    // Transaction: Activate user and STRICT ONE-TIME delete token
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { isEmailVerified: true },
      }),
      this.prisma.verifyEmailToken.delete({ where: { id: record.id } }),
    ]);

    // L8 Security check for Auto-Login
    // Only auto-login if they clicked it on the same device/IP (if recorded)
    let safeToAutoLogin = true;
    if (record.ipAddress && reqIp && record.ipAddress !== reqIp) safeToAutoLogin = false;
    if (record.userAgent && reqUserAgent && record.userAgent !== reqUserAgent) safeToAutoLogin = false;

    if (safeToAutoLogin) {
      const authResponse = await this.authService.issueTokenPair(record.userId, 'customer');
      return { verified: true, requireLogin: false, auth: authResponse };
    }

    return { verified: true, requireLogin: true };
  }

  /**
   * Cleanup helper to remove token on failure
   */
  private async revokeToken(token: string) {
    await this.prisma.verifyEmailToken.delete({ where: { token } });
  }

  // Optional: cleanup expired tokens periodically (cron)
  async cleanupExpiredTokens() {
    await this.prisma.verifyEmailToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
