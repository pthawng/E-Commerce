import { BadRequestException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from 'src/prisma/prisma.service';
import { SystemSettingService } from '../system-setting.service';

type TxClient = {
  systemSetting: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
  };
  auditLog: {
    create: jest.Mock;
  };
};

function createSubject() {
  const tx: TxClient = {
    systemSetting: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const prisma = {
    systemSetting: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback: (txClient: TxClient) => Promise<unknown>) => callback(tx)),
  };

  const cache = {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  const requestContext = {
    get: jest.fn().mockReturnValue({
      correlationId: 'corr-settings',
      requestId: 'req-settings',
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    }),
  };

  return {
    service: new SystemSettingService(
      prisma as unknown as PrismaService,
      cache as unknown as Cache,
      requestContext as any,
    ),
    prisma,
    cache,
    requestContext,
    tx,
  };
}

describe('SystemSettingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('falls back to the typed default when a setting is missing', async () => {
    const { service, prisma, cache } = createSubject();
    prisma.systemSetting.findUnique.mockResolvedValue(null);

    await expect(service.getNumber('order.paymentTimeoutMinutes')).resolves.toBe(15);

    expect(prisma.systemSetting.findUnique).toHaveBeenCalledWith({
      where: { key: 'order.paymentTimeoutMinutes' },
    });
    expect(cache.set).toHaveBeenCalledWith('system-setting:order.paymentTimeoutMinutes', 15, 60000);
  });

  it('exposes typed registry metadata for back-office settings UI', () => {
    const { service } = createSubject();

    const registry = service.getRegistry();

    expect(registry).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'order.paymentTimeoutMinutes',
          group: 'order',
          defaultValue: 15,
          valueType: 'number',
        }),
        expect.objectContaining({
          key: 'auth.mfa.required',
          group: 'auth',
          defaultValue: true,
          valueType: 'boolean',
        }),
      ]),
    );
  });

  it('falls back to the typed default when stored data is invalid', async () => {
    const { service, prisma } = createSubject();
    prisma.systemSetting.findUnique.mockResolvedValue({
      key: 'order.paymentTimeoutMinutes',
      value: -1,
      version: 2,
    });

    await expect(service.getNumber('order.paymentTimeoutMinutes')).resolves.toBe(15);
  });

  it('validates settings before writing and rejects invalid values', async () => {
    const { service, prisma } = createSubject();

    await expect(
      service.updateSettings({ 'order.paymentTimeoutMinutes': -1 }, 'admin-1'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects unknown setting keys instead of persisting ad hoc business rules', async () => {
    const { service, prisma } = createSubject();

    await expect(
      service.updateSettings({ 'order.unknownRule': 10 }, 'admin-1'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('increments version and writes an audit trail for valid updates', async () => {
    const { service, tx } = createSubject();
    tx.systemSetting.findUnique.mockResolvedValue({
      key: 'order.paymentTimeoutMinutes',
      value: 15,
      version: 2,
    });
    tx.systemSetting.upsert.mockResolvedValue({
      key: 'order.paymentTimeoutMinutes',
      value: 30,
      version: 3,
    });

    const result = await service.updateSettings(
      { 'order.paymentTimeoutMinutes': 30 },
      'admin-1',
      'Extend payment window during bank maintenance',
    );

    expect(result).toEqual({
      success: true,
      updated: [{ key: 'order.paymentTimeoutMinutes', value: 30, version: 3 }],
    });
    expect(tx.systemSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          value: 30,
          version: 3,
          updatedBy: 'admin-1',
        }),
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'admin-1',
        action: 'SYSTEM_SETTING_UPDATE',
        entityTable: 'system_settings',
        entityId: 'order.paymentTimeoutMinutes',
        actorType: 'staff',
        resourceType: 'system_settings',
        resourceId: 'order.paymentTimeoutMinutes',
        reason: 'Extend payment window during bank maintenance',
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
        correlationId: 'corr-settings',
        requestId: 'req-settings',
        before: { value: 15, version: 2 },
        after: { value: 30, version: 3 },
        metadata: expect.objectContaining({
          reason: 'Extend payment window during bank maintenance',
        }),
      }),
    });
  });

  it('invalidates aggregate and per-key cache entries after updates', async () => {
    const { service, cache, tx } = createSubject();
    tx.systemSetting.findUnique.mockResolvedValue(null);
    tx.systemSetting.upsert.mockResolvedValue({
      key: 'inventory.lowStockThreshold',
      value: 8,
      version: 1,
    });

    await service.updateSettings({ 'inventory.lowStockThreshold': 8 }, 'admin-1');

    expect(cache.del).toHaveBeenCalledWith('system-settings:all');
    expect(cache.del).toHaveBeenCalledWith('system-setting:inventory.lowStockThreshold');
    expect(cache.del).toHaveBeenCalledWith('dashboard_stats');
  });
});
