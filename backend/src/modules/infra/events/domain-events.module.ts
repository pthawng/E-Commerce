import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { DomainEventRelayService } from './domain-event-relay.service';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'system-events',
      // DLQ / resilience configuration.
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true, // Keep clear after success, keep failed in BullMQ for L1 debug
        removeOnFail: false,
      },
    }),
  ],
  providers: [DomainEventRelayService],
  exports: [BullModule],
})
export class DomainEventsModule {}
