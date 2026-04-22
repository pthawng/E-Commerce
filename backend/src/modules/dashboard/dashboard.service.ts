import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OrderStatusEnum } from '@prisma/client';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

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

    const [revenueData, ordersToday, lowStockItems, totalOrders, totalSessions] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { notIn: [OrderStatusEnum.cancelled] } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.inventoryItem.count({
        where: { quantity: { lt: 5 } },
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
    // L8 SE: Ensure 'Today' is always included as the final anchor
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
        AND status != 'cancelled'
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
      // L8 SE: Reduced cache TTL to 5 mins for real-time dashboard feel
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
    } catch { }

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
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { fullName: true, email: true },
        },
      },
    });
  }

  async getLowStockAlerts(limit: number = 10) {
    return this.prisma.inventoryItem.findMany({
      where: { quantity: { lt: 10 } },
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
