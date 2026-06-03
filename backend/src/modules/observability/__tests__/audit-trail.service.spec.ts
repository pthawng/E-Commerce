import { PrismaService } from 'src/prisma/prisma.service';
import { AuditTrailService } from '../audit-trail.service';

describe('AuditTrailService', () => {
  it('writes unified audit records with before/after snapshots and request context', async () => {
    const prisma = {
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };
    const context = {
      get: jest.fn().mockReturnValue({
        correlationId: 'corr-1',
        requestId: 'req-1',
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      }),
    };
    const service = new AuditTrailService(prisma as unknown as PrismaService, context as any);

    await service.record({
      actorId: 'user-1',
      actorType: 'staff',
      action: 'SETTINGS_UPDATE',
      resourceType: 'system_settings',
      resourceId: 'order.paymentTimeoutMinutes',
      before: { value: 15 },
      after: { value: 30 },
      reason: 'maintenance',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        actorType: 'staff',
        action: 'SETTINGS_UPDATE',
        entityTable: 'system_settings',
        entityId: 'order.paymentTimeoutMinutes',
        before: { value: 15 },
        after: { value: 30 },
        reason: 'maintenance',
        correlationId: 'corr-1',
        requestId: 'req-1',
      }),
    });
  });
});
