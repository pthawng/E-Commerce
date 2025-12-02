import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class ForgotPassEmailService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  private async persistToken(userId: string) {
    await this.prismaService.resetPasswordToken.deleteMany({ where: { userId } });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prismaService.resetPasswordToken.create({
      data: { token, userId, expiresAt },
    });

    return { token, expiresAt };
  }

  async sendForgotPasswordEmail(userId: string, email: string, fullName?: string) {
    const { token, expiresAt } = await this.persistToken(userId);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const normalizedBaseUrl = frontendUrl.replace(/\/$/, '');
    const resetUrl = `${normalizedBaseUrl}/reset-password?token=${token}`;
    const expiryMinutes = Math.ceil((expiresAt.getTime() - Date.now()) / 60000);

    const isSent = await this.mailService.sendMail({
      to: email,
      subject: 'Reset your password',
      template: 'forgot-pasword',
      context: {
        name: fullName,
        resetUrl,
        expiryMinutes,
        supportEmail: this.configService.get<string>('MAIL_FROM'),
        companyName: this.configService.get<string>('COMPANY_NAME') || 'Ray Paradis',
      },
    });

    if (!isSent) {
      await this.prismaService.resetPasswordToken.deleteMany({ where: { token } });
      throw new BadRequestException('Không thể gửi email đặt lại mật khẩu, vui lòng thử lại.');
    }
  }
}
