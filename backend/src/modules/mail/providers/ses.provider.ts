import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailOptions, EmailProvider, EmailResponse } from './email-provider.interface';

@Injectable()
export class SesProvider extends EmailProvider {
  private readonly logger = new Logger(SesProvider.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  async send(options: EmailOptions): Promise<EmailResponse> {
    const from = options.from || this.configService.get<string>('MAIL_FROM');

    this.logger.log(`[MOCK SES] Sending email to ${options.to}`);

    // In a real implementation, we would use AWS SDK here
    // const result = await this.ses.sendEmail(...).promise();

    return {
      success: true,
      messageId: `ses-mock-${Date.now()}`,
      provider: 'ses',
    };
  }

  getName(): 'sendgrid' | 'ses' {
    return 'ses';
  }
}
