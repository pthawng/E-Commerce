import { PrincipalType } from 'src/common/types/principal.types';
import { SecurityEventType } from '../security-event-bus.service';
import { SecurityOrchestrator } from '../security-orchestrator.service';

describe('SecurityOrchestrator', () => {
  it('persists security events before running mitigation', async () => {
    const bus = {
      events$: {
        subscribe: jest.fn(),
      },
    };
    const prisma = {
      securityEventLog: {
        create: jest.fn().mockResolvedValue({ id: 'security-event-1' }),
      },
      refreshToken: {
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const service = new SecurityOrchestrator(bus as any, prisma as any);

    await (service as any).handleEvent({
      type: SecurityEventType.TOKEN_REPLAY,
      principal: { id: 'user-1', type: PrincipalType.USER },
      severity: 'critical',
      metadata: { jti: 'refresh-jti' },
      correlationId: 'corr-security',
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
      timestamp: new Date('2026-06-03T00:00:00.000Z'),
    });

    expect(prisma.securityEventLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: SecurityEventType.TOKEN_REPLAY,
        principalId: 'user-1',
        principalType: PrincipalType.USER,
        severity: 'critical',
        metadata: { jti: 'refresh-jti' },
        correlationId: 'corr-security',
      }),
    });
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: {
        revokedAt: expect.any(Date),
        revokedReason: 'AUTO_MITIGATION_REPLAY_DETECTED',
      },
    });
  });
});
