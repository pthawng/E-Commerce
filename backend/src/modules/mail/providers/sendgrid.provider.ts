import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import { EmailOptions, EmailProvider, EmailResponse } from './email-provider.interface';

@Injectable()
export class SendGridProvider extends EmailProvider {
  private readonly logger = new Logger(SendGridProvider.name);

  constructor(private readonly configService: ConfigService) {
    super();
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    } else {
      this.logger.warn('SENDGRID_API_KEY is not defined');
    }
  }

  async send(options: EmailOptions): Promise<EmailResponse> {
    const from = options.from || this.configService.get<string>('MAIL_FROM');
    
    try {
      const [response] = await sgMail.send({
        to: options.to,
        from: from!,
        subject: options.subject,
        html: options.html,
        customArgs: options.metadata,
      });

      // SendGrid response headers usually contain the message ID
      const messageId = response.headers['x-message-id'] as string;

      return {
        success: true,
        messageId,
        provider: 'sendgrid',
      };
    } catch (error) {
      this.logger.error(`SendGrid failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
        provider: 'sendgrid',
      };
    }
  }

  getName(): 'sendgrid' | 'ses' {
    return 'sendgrid';
  }
}
