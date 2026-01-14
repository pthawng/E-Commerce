import { VerifyEmailDto } from '@modules/auth/dto/verify-email.dto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class VerifyEmailService {
  private readonly logger = new Logger(VerifyEmailService.name);
  private readonly TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
  private readonly TOKEN_BYTE_LENGTH = 32;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Generates a crytographically secure token and persists it.
   */
  async createAndSaveToken(userId: string) {
    const token = randomBytes(this.TOKEN_BYTE_LENGTH).toString('hex');
    const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MS);

    await this.prisma.verifyEmailToken.create({
      data: { token, userId, expiresAt },
    });

    return token;
  }

  async sendVerifyEmail(user: { id: string; email: string; fullName: string }) {
    const token = await this.createAndSaveToken(user.id);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    // Robust URL construction
    const verificationUrl = new URL('/verify-email', frontendUrl);
    verificationUrl.searchParams.set('token', token);

    try {
      const isSent = await this.mailService.sendMail({
        to: user.email,
        subject: 'Verify your email',
        template: 'verify-email',
        context: {
          name: user.fullName,
          verificationUrl: verificationUrl.toString(),
          expiryMinutes: 60,
          supportEmail: this.configService.get<string>('MAIL_FROM'),
          companyName: this.configService.get<string>('COMPANY_NAME'),
        },
      });

      if (!isSent) {
        this.logger.warn(`Failed to send verification email to ${user.email}`);
        await this.revokeToken(token);
        throw new BadRequestException('Use unable to send verification email. Please try again.');
      }

      return true;
    } catch (error) {
      await this.revokeToken(token);
      if (error instanceof BadRequestException) throw error;

      this.logger.error(`Error in sendVerifyEmail: ${error.message}`, error.stack);
      throw new BadRequestException('An error occurred while sending verification email.');
    }
  }

  async verifyToken(dto: VerifyEmailDto) {
    const record = await this.prisma.verifyEmailToken.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (!record) throw new BadRequestException('Token invalid or expired');

    if (record.expiresAt < new Date()) {
      await this.prisma.verifyEmailToken.delete({ where: { id: record.id } });
      throw new BadRequestException('Token expired');
    }

    // Transaction: Activate user and delete token
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { isEmailVerified: true },
      }),
      this.prisma.verifyEmailToken.delete({ where: { id: record.id } }),
    ]);

    return true;
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
