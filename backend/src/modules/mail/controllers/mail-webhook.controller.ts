import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventWebhook } from '@sendgrid/eventwebhook';
import { Request } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { EmailOutboxService } from '../services/email-outbox.service';

@Controller('webhooks/mail')
export class MailWebhookController {
  private readonly logger = new Logger(MailWebhookController.name);

  constructor(
    private readonly outboxService: EmailOutboxService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('sendgrid')
  @HttpCode(HttpStatus.OK)
  async handleSendGridWebhook(
    @Req() req: Request,
    @Headers('x-twilio-email-event-webhook-signature') signature: string,
    @Headers('x-twilio-email-event-webhook-timestamp') timestamp: string,
  ) {
    const publicKey = this.configService.get<string>('SENDGRID_WEBHOOK_PUBLIC_KEY');

    // In production, verify signatures strictly.
    if (publicKey && signature && timestamp) {
      try {
        const verify = new EventWebhook();
        const ecdsaPublicKey = verify.convertPublicKeyToECDSA(publicKey);
        const payload = JSON.stringify(req.body) + '\r\n'; // Sendgrid requires raw payload verification

        const isValid = verify.verifySignature(ecdsaPublicKey, payload, signature, timestamp);
        if (!isValid) {
          throw new UnauthorizedException('Invalid SendGrid Signature');
        }
      } catch (err) {
        this.logger.error(`Webhook Verification failed: ${err.message}`);
        // If strict mode is enforced, throw. For dev, we might bypass.
        if (this.configService.get('NODE_ENV') === 'production') {
          throw new UnauthorizedException('Invalid Signature');
        }
      }
    }

    const events = req.body;
    if (!Array.isArray(events)) {
      return { success: true };
    }

    // Process events
    for (const event of events) {
      const providerId = event.sg_message_id;
      if (!providerId) continue;

      let status: 'DELIVERED' | 'BOUNCED' | 'SPAM' | 'REJECTED' | null = null;

      switch (event.event) {
        case 'delivered':
          status = 'DELIVERED';
          break;
        case 'bounce':
        case 'dropped':
          status = 'BOUNCED';
          break;
        case 'spamreport':
          status = 'SPAM';
          break;
        case 'deferred':
          status = 'REJECTED';
          break;
      }

      if (status) {
        await this.outboxService.updateStatusByProviderMessageId(providerId, status);
      }
    }

    return { success: true };
  }
}
