import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class VerifyEmailService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  async generateVerifyToken(userId: string) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 phút

    const verifyToken = await this.prisma.verifyEmailToken.create({
      data: { token, userId, expiresAt },
    });

    return verifyToken.token;
  }

  async sendVerifyEmail(user: { id: string; email: string; fullName: string }) {
    const token = await this.generateVerifyToken(user.id);

    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;

    const isSent = await this.mailService.sendMail({
      to: user.email,
      subject: 'Verify your email',
      template: 'verify-email',
      context: {
        name: user.fullName,
        verificationUrl,
        expiryMinutes: 60,
        supportEmail: this.configService.get<string>('MAIL_FROM'),
        companyName: this.configService.get<string>('COMPANY_NAME'),
      },
    });

    if (!isSent) {
      await this.prisma.verifyEmailToken.delete({ where: { token } });
      throw new BadRequestException('Không thể gửi email xác minh, vui lòng thử lại.');
    }

    return true;
  }

  async verifyToken(token: string) {
    const record = await this.prisma.verifyEmailToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record) throw new BadRequestException('Token invalid or expired');
    if (record.expiresAt < new Date()) {
      await this.prisma.verifyEmailToken.delete({ where: { id: record.id } });
      throw new BadRequestException('Token expired');
    }

    // active user
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { isActive: true },
    });

    // delete token after use
    await this.prisma.verifyEmailToken.delete({ where: { id: record.id } });

    return true;
  }

  // Optional: cleanup expired tokens periodically (cron)
  async cleanupExpiredTokens() {
    await this.prisma.verifyEmailToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
