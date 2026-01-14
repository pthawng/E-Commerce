import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class ForgotPassEmailService {
  private readonly logger = new Logger(ForgotPassEmailService.name);
  private readonly TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
  private readonly TOKEN_BYTE_LENGTH = 32;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Generates a crytographically secure token and persists it.
   * Enforces a single-active-token policy by removing existing tokens for the user.
   */
  private async createAndSaveToken(userId: string) {
    // Clean up any existing tokens for this user first
    await this.prismaService.resetPasswordToken.deleteMany({ where: { userId } });

    const token = randomBytes(this.TOKEN_BYTE_LENGTH).toString('hex');
    const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MS);

    await this.prismaService.resetPasswordToken.create({
      data: { token, userId, expiresAt },
    });

    return { token, expiresAt };
  }

  async sendForgotPasswordEmail(userId: string, email: string, fullName?: string) {
    const { token, expiresAt } = await this.createAndSaveToken(userId);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:8080';
    // Robust URL construction
    const resetUrl = new URL('/reset-password', frontendUrl);
    resetUrl.searchParams.set('token', token);

    const expiryMinutes = Math.ceil((expiresAt.getTime() - Date.now()) / 60000);

    try {
      const isSent = await this.mailService.sendMail({
        to: email,
        subject: 'Reset your password',
        template: 'forgot-password', // Fixed typo: 'forgot-pasword' -> 'forgot-password'
        context: {
          name: fullName || 'Valued Customer',
          resetUrl: resetUrl.toString(),
          expiryMinutes,
          supportEmail: this.configService.get<string>('MAIL_FROM'),
          companyName: this.configService.get<string>('COMPANY_NAME') || 'Ray Paradis',
        },
      });

      if (!isSent) {
        this.logger.warn(`Failed to send password reset email to ${email}`);
        await this.revokeToken(token);
        throw new BadRequestException('Unable to send password reset email. Please try again.');
      }
    } catch (error) {
      // Ensure token is revoked if any error occurs during the process
      await this.revokeToken(token);
      // Re-throw if it's already an HTTP exception, otherwise wrap generic error
      if (error instanceof BadRequestException) throw error;

      this.logger.error(`Error in sendForgotPasswordEmail: ${error.message}`, error.stack);
      throw new BadRequestException('An error occurred while processing your request.');
    }
  }

  /**
   * Helper to revoke a specific token (e.g., if email sending fails).
   */
  private async revokeToken(token: string) {
    await this.prismaService.resetPasswordToken.deleteMany({ where: { token } });
  }
}
