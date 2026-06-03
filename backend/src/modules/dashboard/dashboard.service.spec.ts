import { DashboardService } from './dashboard.service';

function createSubject() {
  const prisma = {
    order: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { totalAmount: 1000000 } }),
      count: jest.fn().mockResolvedValue(2),
      groupBy: jest.fn().mockResolvedValue([{ sessionId: 'session-1' }]),
    },
    inventoryBalance: {
      count: jest.fn().mockResolvedValue(3),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  const cache = {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
  };
  const settings = {
    getNumber: jest.fn().mockResolvedValue(8),
  };

  return {
    service: new DashboardService(prisma as any, cache as any, settings as any),
    prisma,
    settings,
  };
}

describe('DashboardService', () => {
  it('uses Settings Registry low-stock threshold for dashboard stats', async () => {
    const { service, prisma, settings } = createSubject();

    await service.getStats();

    expect(settings.getNumber).toHaveBeenCalledWith('inventory.lowStockThreshold');
    expect(prisma.inventoryBalance.count).toHaveBeenCalledWith({
      where: { quantity: { lt: 8 } },
    });
  });

  it('uses Settings Registry low-stock threshold for alert list', async () => {
    const { service, prisma, settings } = createSubject();

    await service.getLowStockAlerts(5);

    expect(settings.getNumber).toHaveBeenCalledWith('inventory.lowStockThreshold');
    expect(prisma.inventoryBalance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { quantity: { lt: 8 } },
        take: 5,
      }),
    );
  });
});
