import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailService } from './mail.service';
import { EmailOutboxService } from './services/email-outbox.service';
import { OutboxRelayService } from './services/outbox-relay.service';
import { EmailProcessor } from './services/email.processor';
import { SendGridProvider } from './providers/sendgrid.provider';
import { SesProvider } from './providers/ses.provider';
import { MailAdminController } from './controllers/mail-admin.controller';
import { MailWebhookController } from './controllers/mail-webhook.controller';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { EmailRetentionService } from './services/retention.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
  controllers: [MailAdminController, MailWebhookController],
  providers: [
    MailService,
    EmailOutboxService,
    OutboxRelayService,
    EmailProcessor,
    SendGridProvider,
    SesProvider,
    CircuitBreakerService,
    EmailRetentionService,
  ],
  exports: [MailService, EmailOutboxService],
})
export class MailModule {}
