import { Injectable, Logger } from '@nestjs/common';
import { LuxurySegment, OrderStatusEnum } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executive Scorecard: Revenue, Profit, AOV
   * Include period-over-period delta.
   */
  async getExecutiveOverview(range: string = '30d') {
    const days = parseInt(range.replace('d', '')) || 30;
    const now = new Date();
    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStart = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

    const [currentOrders, previousOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          createdAt: { gte: currentStart },
          status: { notIn: [OrderStatusEnum.CANCELLED] },
        },
        include: { items: { include: { productVariant: true } } },
      }),
      this.prisma.order.findMany({
        where: {
          createdAt: { gte: previousStart, lt: currentStart },
          status: { notIn: [OrderStatusEnum.CANCELLED] },
        },
        include: { items: { include: { productVariant: true } } },
      }),
    ]);

    const calculateMetrics = (orders: any[]) => {
      const revenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const cost = orders.reduce((sum, o) => {
        return (
          sum +
          o.items.reduce((iSum: number, item: any) => {
            return iSum + Number(item.productVariant?.costPrice || 0) * item.quantity;
          }, 0)
        );
      }, 0);
      const count = orders.length;
      return {
        revenue,
        profit: revenue - cost,
        aov: count > 0 ? revenue / count : 0,
        count,
      };
    };

    const current = calculateMetrics(currentOrders);
    const previous = calculateMetrics(previousOrders);

    const getDelta = (curr: number, prev: number) => (prev > 0 ? ((curr - prev) / prev) * 100 : 0);

    return {
      metrics: [
        {
          label: 'Revenue',
          value: current.revenue,
          delta: getDelta(current.revenue, previous.revenue),
          prefix: '$',
        },
        {
          label: 'Gross Profit',
          value: current.profit,
          delta: getDelta(current.profit, previous.profit),
          prefix: '$',
        },
        {
          label: 'Average Order Value',
          value: current.aov,
          delta: getDelta(current.aov, previous.aov),
          prefix: '$',
        },
        {
          label: 'Order Volume',
          value: current.count,
          delta: getDelta(current.count, previous.count),
        },
      ],
      revenueChart: this.formatChartData(currentOrders, days),
    };
  }

  /**
   * Luxury Customer Intelligence
   */
  async getCustomerIntelligence() {
    const segments = await this.prisma.user.groupBy({
      by: ['segment'],
      _count: { id: true },
    });

    const clvData = await Promise.all(
      Object.values(LuxurySegment).map(async (segment) => {
        const users = await this.prisma.user.findMany({
          where: { segment },
          include: { orders: { where: { status: OrderStatusEnum.COMPLETED } } },
        });

        const totalRevenue = users.reduce((sum, u) => {
          return sum + u.orders.reduce((oSum, o) => oSum + Number(o.totalAmount), 0);
        }, 0);

        return {
          segment,
          count: users.length,
          avgClv: users.length > 0 ? totalRevenue / users.length : 0,
        };
      }),
    );

    return {
      segmentDistribution: segments.map((s) => ({
        type: s.segment || 'PROSPECT',
        value: s._count.id,
      })),
      clvMatrix: clvData,
    };
  }

  /**
   * Product Mix & Profitability Matrix
   */
  async getProductPerformance(limit: number = 20) {
    const orderItems = await this.prisma.orderItem.findMany({
      include: { productVariant: true },
    });

    const productStats = new Map<string, any>();

    orderItems.forEach((item) => {
      if (!item.productVariantId) return;
      const existing = productStats.get(item.productVariantId) || {
        sku: item.sku,
        name: item.productName,
        volume: 0,
        revenue: 0,
        cost: 0,
      };

      existing.volume += item.quantity;
      existing.revenue += Number(item.price) * item.quantity;
      existing.cost += Number(item.productVariant?.costPrice || 0) * item.quantity;
      productStats.set(item.productVariantId, existing);
    });

    return Array.from(productStats.values())
      .map((p) => ({
        ...p,
        margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  /**
   * Operational Efficiency & Bottleneck Analysis
   */
  async getOperationsPulse() {
    const timelines = await this.prisma.orderTimeline.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Calculate transition time between states.
    const orderTransitions: Record<string, any> = {};

    timelines.forEach((t) => {
      if (!orderTransitions[t.orderId]) orderTransitions[t.orderId] = {};
      if (t.toStatus) {
        orderTransitions[t.orderId][t.toStatus] = t.createdAt;
      }
    });

    const calculateAvgHours = (startStatus: string, endStatus: string) => {
      let totalHours = 0;
      let count = 0;

      Object.values(orderTransitions).forEach((trans: any) => {
        if (trans[startStatus] && trans[endStatus]) {
          const diff =
            (trans[endStatus].getTime() - trans[startStatus].getTime()) / (1000 * 60 * 60);
          totalHours += diff;
          count++;
        }
      });

      return count > 0 ? totalHours / count : 0;
    };

    return [
      { step: 'Confirmation', avgHours: calculateAvgHours('PENDING_PAYMENT', 'CONFIRMED') },
      { step: 'Material Prep', avgHours: calculateAvgHours('CONFIRMED', 'MATERIAL_RESERVED') },
      { step: 'Production', avgHours: calculateAvgHours('MATERIAL_RESERVED', 'IN_PRODUCTION') },
      { step: 'Quality Control', avgHours: calculateAvgHours('IN_PRODUCTION', 'QC') },
      { step: 'Fulfillment', avgHours: calculateAvgHours('QC', 'READY_TO_SHIP') },
    ];
  }

  private formatChartData(orders: any[], days: number) {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      const date = o.createdAt.toISOString().split('T')[0];
      map.set(date, (map.get(date) || 0) + Number(o.totalAmount));
    });

    const result: { date: string; value: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        value: map.get(dateStr) || 0,
      });
    }
    return result;
  }
}
