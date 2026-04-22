import { BullAdapter } from '@bull-board/api/bullAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailAdminController } from './controllers/mail-admin.controller';
import { MailWebhookController } from './controllers/mail-webhook.controller';
import { MailService } from './mail.service';
import { SendGridProvider } from './providers/sendgrid.provider';
import { SesProvider } from './providers/ses.provider';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { EmailOutboxService } from './services/email-outbox.service';
import { EmailProcessor } from './services/email.processor';
import { OutboxRelayService } from './services/outbox-relay.service';
import { EmailRetentionService } from './services/retention.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    BullModule.registerQueue({
      name: 'email-queue',
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullBoardModule.forFeature({
      name: 'email-queue',
      adapter: BullAdapter,
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
