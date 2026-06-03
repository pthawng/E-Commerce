import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OrderStatusEnum } from '@prisma/client';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { SystemSettingService } from '../system/system-setting.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly settings: SystemSettingService,
  ) {}

  async getStats() {
    const cacheKey = 'dashboard_stats';
    try {
      const cachedData = await this.cacheManager.get(cacheKey);
      if (cachedData) return cachedData;
    } catch (e) {
      this.logger.error('Failed to get from cache', e);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lowStockThreshold = await this.settings.getNumber('inventory.lowStockThreshold');
    const [revenueData, ordersToday, activeOrders, lowStockItems, totalOrders, totalSessions] =
      await Promise.all([
        this.prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { status: { not: OrderStatusEnum.CANCELLED } },
        }),
        this.prisma.order.count({
          where: { createdAt: { gte: today } },
        }),
        this.prisma.order.count({
          where: {
            status: {
              in: [
                OrderStatusEnum.PENDING_PAYMENT,
                OrderStatusEnum.CONFIRMED,
                OrderStatusEnum.MATERIAL_RESERVED,
                OrderStatusEnum.IN_PRODUCTION,
                OrderStatusEnum.QC,
                OrderStatusEnum.READY_TO_SHIP,
                OrderStatusEnum.SHIPPED,
              ],
            },
          },
        }),
        this.prisma.inventoryBalance.count({
          where: { quantity: { lt: lowStockThreshold } },
        }),
        this.prisma.order.count(),
        this.prisma.order
          .groupBy({
            by: ['sessionId'],
          })
          .then((res) => res.length),
      ]);

    const stats = {
      revenue: Number(revenueData._sum.totalAmount || 0),
      ordersToday,
      activeOrders,
      lowStockItems,
      conversionRate:
        totalSessions > 0 ? Number(((totalOrders / totalSessions) * 100).toFixed(2)) : 0,
    };

    try {
      await this.cacheManager.set(cacheKey, stats, 1800 * 1000);
    } catch (e) {
      this.logger.error('Failed to set cache', e);
    }

    return stats;
  }

  async getRevenue(range: string = '7d') {
    const cacheKey = `dashboard_revenue_${range}`;
    try {
      const cachedData = await this.cacheManager.get<any[]>(cacheKey);
      if (cachedData) return cachedData;
    } catch (e) {
      this.logger.error('Failed to get from cache', e);
    }

    const days = parseInt(range.replace('d', '')) || 7;
    // Ensure today is always included as the final anchor.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (days - 1));

    const revenuePoints: any[] = await this.prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') as date,
        COALESCE(SUM("totalAmount")::FLOAT, 0) as amount
      FROM "Order"
      WHERE "createdAt" >= ${startDate}
        AND status != ${OrderStatusEnum.CANCELLED}::"OrderStatusEnum"
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY DATE_TRUNC('day', "createdAt") ASC
    `;

    const fullSeries: { date: string; amount: number }[] = [];
    const revenueMap = new Map<string, number>(revenuePoints.map((p) => [p.date, p.amount]));

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      fullSeries.push({
        date: dateStr,
        amount: revenueMap.get(dateStr) || 0,
      });
    }

    try {
      // Reduced cache TTL to 5 minutes for a fresher dashboard.
      await this.cacheManager.set(cacheKey, fullSeries, 300 * 1000);
    } catch (e) {
      this.logger.error('Failed to set cache', e);
    }

    return fullSeries;
  }

  async getTopProducts(limit: number = 5) {
    const cacheKey = `dashboard_top_products_${limit}`;
    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) return cached;
    } catch (e) {
      this.logger.error('Failed to read top products cache', e);
    }

    const topItems = await this.prisma.orderItem.groupBy({
      by: ['productVariantId'],
      _sum: {
        quantity: true,
        price: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    const result = await Promise.all(
      topItems.map(async (item) => {
        if (!item.productVariantId) return null;
        const variant = await this.prisma.productVariant.findUnique({
          where: { id: item.productVariantId },
          include: { product: true },
        });
        return {
          id: item.productVariantId,
          name: `${(variant?.product.name as any)?.vi || 'N/A'} - ${(variant?.variantTitle as any)?.vi || ''}`,
          sales: item._sum.quantity || 0,
          revenue: Number(item._sum.price || 0) * (item._sum.quantity || 0),
        };
      }),
    );

    const filtered = result.filter(Boolean);
    await this.cacheManager.set(cacheKey, filtered, 3600 * 1000);
    return filtered;
  }

  async getRecentOrders(limit: number = 10) {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { fullName: true, email: true },
        },
        items: true,
      },
    });

    return orders.map((order) => {
      // Workload calculation.
      // Weighted by total quantity of items and order value as a proxy for production complexity
      const itemWeight = order.items.reduce((sum, item) => sum + item.quantity, 0) * 15;
      const valueWeight = Math.min(50, order.totalAmount.toNumber() / 1000);
      const workloadFactor = Math.min(100, itemWeight + valueWeight);

      return {
        ...order,
        workloadFactor,
        slaStatus: this.calculateSlaStatus(order),
      };
    });
  }

  private calculateSlaStatus(order: any) {
    const hoursSinceCreation =
      (new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);

    // Business Logic: 48h limit for luxury fulfillment compliance
    const isCompleted = ['COMPLETED', 'DELIVERED', 'SHIPPED'].includes(order.status);

    if (isCompleted) return 'in_compliance';
    if (hoursSinceCreation > 48) return 'variance_detected';
    return 'in_variance';
  }

  async getLowStockAlerts(limit: number = 10) {
    const lowStockThreshold = await this.settings.getNumber('inventory.lowStockThreshold');
    return this.prisma.inventoryBalance.findMany({
      where: { quantity: { lt: lowStockThreshold } },
      orderBy: { quantity: 'asc' },
      take: limit,
      include: {
        productVariant: {
          include: { product: true },
        },
      },
    });
  }
}
