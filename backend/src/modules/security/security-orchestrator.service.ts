import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecurityEvent, SecurityEventBus, SecurityEventType } from './security-event-bus.service';

@Injectable()
export class SecurityOrchestrator implements OnModuleInit {
  private readonly logger = new Logger(SecurityOrchestrator.name);

  constructor(
    private readonly eventBus: SecurityEventBus,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.eventBus.events$.subscribe((event) => this.handleEvent(event));
    this.logger.log('Security Orchestrator initialized and listening to event bus.');
  }

  private async handleEvent(event: SecurityEvent) {
    this.logger.warn(
      `Security Event Captured: [${event.type}] for Principal [${event.principal.id}]`,
    );

    switch (event.type) {
      case SecurityEventType.TOKEN_REPLAY:
        await this.handleTokenReplay(event);
        break;
      case SecurityEventType.OWNERSHIP_VIOLATION:
        await this.handleOwnershipViolation(event);
        break;
      // Future: Integration with external SIEM / PagerDuty / Honeypot
    }
  }

  private async handleTokenReplay(event: SecurityEvent) {
    // Decision: Global Revocation for this user
    this.logger.error(
      `CRITICAL: Triggering Global Revocation for User ${event.principal.id} due to TOKEN_REPLAY`,
    );

    // Auto-Mitigation: Invalidate everything
    await this.prisma.refreshToken.updateMany({
      where: { userId: event.principal.id },
      data: {
        revokedAt: new Date(),
        revokedReason: 'AUTO_MITIGATION_REPLAY_DETECTED',
      },
    });

    // Strategy: We could also blacklist the IP in Redis for N minutes
  }

  private async handleOwnershipViolation(event: SecurityEvent) {
    // Decision: Log for manual review + potential threshold-based block
    // Metadata contains the resource ID
    this.logger.warn(
      `Behavioral Alert: Principal ${event.principal.id} attempted unauthorized access to ${event.metadata?.context}`,
    );
  }
}
