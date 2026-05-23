import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailOptions, EmailProvider, EmailResponse } from './email-provider.interface';

@Injectable()
export class SmtpProvider extends EmailProvider {
  private readonly logger = new Logger(SmtpProvider.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  async send(options: EmailOptions): Promise<EmailResponse> {
    const host = this.configService.get<string>('SMTP_HOST', 'localhost');
    const port = this.configService.get<number>('SMTP_PORT', 1025);
    const secure = this.configService.get<boolean>('SMTP_SECURE', false);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const from = options.from || this.buildDefaultFrom();

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    try {
      const result = await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      return {
        success: true,
        messageId: result.messageId || `smtp-${Date.now()}`,
        provider: 'smtp',
      };
    } catch (error) {
      this.logger.error(`SMTP send failed via ${host}:${port}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
        provider: 'smtp',
      };
    }
  }

  getName(): 'smtp' {
    return 'smtp';
  }

  private buildDefaultFrom(): string {
    const email = this.configService.get<string>('MAIL_FROM');
    const name = this.configService.get<string>('MAIL_FROM_NAME');
    return name ? `"${name}" <${email}>` : email!;
  }
}
