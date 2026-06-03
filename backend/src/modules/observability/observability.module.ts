import { Global, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditTrailService } from './audit-trail.service';
import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { DomainActivityService } from './domain-activity.service';
import { ErrorClassifierService } from './error-classifier.service';
import { RequestContextService } from './request-context.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    RequestContextService,
    CorrelationIdMiddleware,
    AuditTrailService,
    ErrorClassifierService,
    DomainActivityService,
  ],
  exports: [
    RequestContextService,
    CorrelationIdMiddleware,
    AuditTrailService,
    ErrorClassifierService,
    DomainActivityService,
  ],
})
export class ObservabilityModule {}
