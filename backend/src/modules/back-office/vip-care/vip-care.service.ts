import { Injectable, NotFoundException } from '@nestjs/common';
import { LuxurySegment, OrderStatusEnum, UserType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const ACTIVE_ORDER_STATUSES: OrderStatusEnum[] = [
  OrderStatusEnum.CONFIRMED,
  OrderStatusEnum.MATERIAL_RESERVED,
  OrderStatusEnum.IN_PRODUCTION,
  OrderStatusEnum.QC,
  OrderStatusEnum.READY_TO_SHIP,
];

const CONCIERGES = ['S. Chen', 'J. Dubois', 'L. Muller', 'P. Holt'];

@Injectable()
export class VipCareService {
  constructor(private readonly prisma: PrismaService) {}

  async getCommandCenter() {
    const [clients, timelineEvents, opportunities, gestures, aftercareRequests] = await Promise.all(
      [
        this.listClients(),
        this.getTimelineEvents(),
        this.getOpportunities(),
        this.getGestures(),
        this.getAftercareRequests(),
      ],
    );

    const tasks = this.buildTasks(clients);
    const atRiskValue = clients
      .filter((client) => client.risk >= 60)
      .reduce((sum, client) => sum + client.ltvValue, 0);
    const pipelineValue = opportunities.reduce(
      (sum, opportunity) => sum + opportunity.valueNumber,
      0,
    );

    return {
      summary: {
        todayTouches: tasks.filter((task) => task.due === 'Today').length,
        overdueFollowUps: tasks.filter((task) => task.due === 'Overdue').length,
        atRiskValue: this.formatCurrency(atRiskValue),
        bespokePipeline: this.formatCurrency(pipelineValue),
        vipRevenue: this.formatCurrency(clients.reduce((sum, client) => sum + client.ltvValue, 0)),
        ltvGrowth: '+0%',
        foundersCoverage: this.getCoverage(clients),
      },
      clients,
      tasks,
      timelineEvents,
      opportunities,
      gestures,
      aftercareRequests,
      privateEvents: [],
      conciergePerformance: this.buildConciergePerformance(clients, tasks, opportunities),
    };
  }

  async listClients(status?: string) {
    const users = await this.prisma.user.findMany({
      where: {
        userType: UserType.CUSTOMER,
        deletedAt: null,
      },
      include: {
        preferences: true,
        lifeEvents: { orderBy: { eventDate: 'asc' }, take: 8 },
        orders: {
          where: { status: { not: OrderStatusEnum.CANCELLED } },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            items: true,
            timelines: { orderBy: { createdAt: 'desc' }, take: 5 },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    const clients = users.map((user, index) => this.mapClient(user, index));
    if (!status) return clients;
    return clients.filter((client) => client.status.toLowerCase().replace(/\s+/g, '-') === status);
  }

  async getClient(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, userType: UserType.CUSTOMER, deletedAt: null },
      include: {
        preferences: true,
        lifeEvents: { orderBy: { eventDate: 'asc' } },
        orders: {
          where: { status: { not: OrderStatusEnum.CANCELLED } },
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            timelines: { orderBy: { createdAt: 'desc' }, take: 20 },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('VIP client not found');

    const client = this.mapClient(user, 0);
    return {
      client,
      timelineEvents: user.orders.flatMap((order) =>
        order.timelines.map((event) => ({
          type: this.toTitle(event.actorType || 'system'),
          when: event.createdAt.toISOString(),
          title: event.action,
          body: event.description || `Order ${order.code}`,
          tone: event.actorType === 'system' ? 'info' : 'gold',
        })),
      ),
      opportunities: this.mapOrdersToOpportunities(user.orders, user.id),
      gestures: this.mapLifeEventsToGestures(user.lifeEvents, client),
      aftercareRequests: this.mapOrdersToAftercare(user.orders, client),
      orders: user.orders.map((order) => ({
        id: order.id,
        code: order.code,
        status: order.status,
        totalAmount: Number(order.totalAmount),
        currency: order.currency,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          id: item.id,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          price: Number(item.price),
        })),
      })),
    };
  }

  private async getTimelineEvents() {
    const timelines = await this.prisma.orderTimeline.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        order: { select: { code: true, user: { select: { fullName: true } } } },
      },
    });

    return timelines.map((event) => ({
      type: this.toTitle(event.actorType || 'system'),
      when: event.createdAt.toISOString(),
      title: event.action,
      body: `${event.order.user?.fullName ?? 'Guest'} - ${event.description ?? event.order.code}`,
      tone: event.actorType === 'system' ? 'info' : 'gold',
    }));
  }

  private async getOpportunities() {
    const orders = await this.prisma.order.findMany({
      where: { status: { in: ACTIVE_ORDER_STATUSES }, userId: { not: null } },
      orderBy: { totalAmount: 'desc' },
      take: 20,
      include: { user: true, items: true },
    });

    return orders.map((order) => {
      const valueNumber = Number(order.totalAmount);
      return {
        clientId: order.userId,
        client: order.user?.fullName ?? 'Unknown client',
        title: order.items[0]?.productName ?? `Order ${order.code}`,
        stage: this.toTitle(order.status),
        value: this.formatCurrency(valueNumber, order.currency),
        valueNumber,
        close: order.estimatedDeliveryAt?.toISOString() ?? order.updatedAt.toISOString(),
        next: this.nextActionForOrder(order.status),
      };
    });
  }

  private async getGestures() {
    const now = Date.now();
    const events = await this.prisma.userLifeEvent.findMany({
      where: {
        eventDate: {
          gte: new Date(now - 7 * 24 * 60 * 60 * 1000),
          lte: new Date(now + 45 * 24 * 60 * 60 * 1000),
        },
      },
      include: { user: true },
      orderBy: { eventDate: 'asc' },
      take: 20,
    });

    return events.map((event) => ({
      clientId: event.userId,
      client: event.user.fullName,
      type: this.toTitle(event.eventType),
      state: 'Suggested',
      value: 'Policy based',
      reason: `Milestone on ${event.eventDate.toISOString().slice(0, 10)}`,
    }));
  }

  private async getAftercareRequests() {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatusEnum.DELIVERED, OrderStatusEnum.COMPLETED] },
        deliveredAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
      include: { user: true, items: true },
      orderBy: { deliveredAt: 'desc' },
      take: 20,
    });

    return orders.map((order) => ({
      clientId: order.userId,
      client: order.user?.fullName ?? 'Unknown client',
      item: order.items[0]?.productName ?? `Order ${order.code}`,
      state: 'Post-delivery follow-up',
      sla: 'On track',
      owner: 'Client service',
    }));
  }

  private mapClient(user: any, index: number) {
    const ltvValue = user.orders.reduce(
      (sum: number, order: any) => sum + Number(order.totalAmount),
      0,
    );
    const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const spend12mValue = user.orders
      .filter((order: any) => order.createdAt >= twelveMonthsAgo)
      .reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0);
    const activeOrders = user.orders.filter((order: any) =>
      ACTIVE_ORDER_STATUSES.includes(order.status),
    );
    const latestOrder = user.orders[0];
    const lastTouchDate = latestOrder?.updatedAt ?? user.updatedAt ?? user.createdAt;
    const daysSinceTouch = Math.max(
      0,
      Math.floor((Date.now() - new Date(lastTouchDate).getTime()) / (24 * 60 * 60 * 1000)),
    );
    const risk = this.calculateRisk(
      daysSinceTouch,
      activeOrders.length,
      user.lifeEvents.length,
      user.segment,
    );

    return {
      id: user.id,
      initials: this.initials(user.fullName),
      name: user.fullName,
      formOfAddress: user.fullName,
      city: this.extractCity(latestOrder?.shippingAddress),
      language: 'Not captured',
      tier: this.segmentToTier(user.segment),
      status: this.clientStatus(risk, activeOrders.length, spend12mValue),
      concierge: CONCIERGES[index % CONCIERGES.length],
      ltv: this.formatCurrency(ltvValue, latestOrder?.currency),
      ltvValue,
      spend12m: this.formatCurrency(spend12mValue, latestOrder?.currency),
      spend12mValue,
      openValue: this.formatCurrency(
        activeOrders.reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0),
        latestOrder?.currency,
      ),
      risk,
      lastTouch: daysSinceTouch === 0 ? 'Today' : `${daysSinceTouch}d ago`,
      nextTouch: this.nextTouch(user.lifeEvents, risk),
      contactPreference: user.phone ? `Phone ${user.phone}` : 'Not captured',
      entourage: 'Not captured',
      sizes: user.preferences
        .filter((preference: any) => preference.category.toLowerCase().includes('size'))
        .map((preference: any) => preference.value),
      preferences: user.preferences.map((preference: any) => preference.value),
      sensitiveNotes: 0,
      activeServices: 0,
      openApprovals: risk >= 60 ? 1 : 0,
    };
  }

  private buildTasks(clients: any[]) {
    return clients
      .flatMap((client) => {
        const tasks: any[] = [];
        if (client.risk >= 60) {
          tasks.push({
            clientId: client.id,
            client: client.name,
            matter: 'Relationship risk follow-up',
            due: 'Overdue',
            owner: client.concierge,
            priority: 'Critical',
          });
        }
        if (client.nextTouch !== 'No scheduled milestone') {
          tasks.push({
            clientId: client.id,
            client: client.name,
            matter: client.nextTouch,
            due: client.risk >= 40 ? 'Today' : 'Upcoming',
            owner: client.concierge,
            priority: client.tier === 'Founders Circle' ? 'High' : 'Medium',
          });
        }
        return tasks;
      })
      .slice(0, 30);
  }

  private buildConciergePerformance(clients: any[], tasks: any[], opportunities: any[]) {
    return CONCIERGES.map((name) => {
      const ownedClients = clients.filter((client) => client.concierge === name);
      const ownedTasks = tasks.filter((task) => task.owner === name);
      const overdue = ownedTasks.filter((task) => task.due === 'Overdue').length;
      const pipelineValue = opportunities
        .filter((opportunity) => ownedClients.some((client) => client.id === opportunity.clientId))
        .reduce((sum, opportunity) => sum + opportunity.valueNumber, 0);

      return {
        name,
        region: this.conciergeRegion(name),
        clients: ownedClients.length,
        overdue,
        sla: ownedTasks.length
          ? `${Math.round(((ownedTasks.length - overdue) / ownedTasks.length) * 100)}%`
          : '100%',
        response: 'Not captured',
        pipeline: this.formatCurrency(pipelineValue),
      };
    });
  }

  private mapOrdersToOpportunities(orders: any[], clientId: string) {
    return orders
      .filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status))
      .map((order) => {
        const valueNumber = Number(order.totalAmount);
        return {
          clientId,
          title: order.items[0]?.productName ?? `Order ${order.code}`,
          stage: this.toTitle(order.status),
          value: this.formatCurrency(valueNumber, order.currency),
          valueNumber,
          close: order.estimatedDeliveryAt?.toISOString() ?? order.updatedAt.toISOString(),
          next: this.nextActionForOrder(order.status),
        };
      });
  }

  private mapLifeEventsToGestures(lifeEvents: any[], client: any) {
    return lifeEvents.map((event) => ({
      clientId: client.id,
      client: client.name,
      type: this.toTitle(event.eventType),
      state: 'Suggested',
      value: 'Policy based',
      reason: `Milestone on ${event.eventDate.toISOString().slice(0, 10)}`,
    }));
  }

  private mapOrdersToAftercare(orders: any[], client: any) {
    return orders
      .filter((order) =>
        [OrderStatusEnum.DELIVERED, OrderStatusEnum.COMPLETED].includes(order.status),
      )
      .map((order) => ({
        clientId: client.id,
        client: client.name,
        item: order.items[0]?.productName ?? `Order ${order.code}`,
        state: 'Post-delivery follow-up',
        sla: 'On track',
        owner: 'Client service',
      }));
  }

  private segmentToTier(segment?: LuxurySegment | null) {
    if (segment === LuxurySegment.VIC) return 'Founders Circle';
    if (segment === LuxurySegment.VVIP || segment === LuxurySegment.VIP) return 'Atelier Prive';
    return 'Maison';
  }

  private clientStatus(risk: number, activeOrders: number, spend12m: number) {
    if (risk >= 60) return 'At risk';
    if (activeOrders > 0) return 'Bespoke';
    if (spend12m > 0) return 'High potential';
    return 'Active';
  }

  private calculateRisk(
    daysSinceTouch: number,
    activeOrders: number,
    lifeEventCount: number,
    segment?: LuxurySegment | null,
  ) {
    let score = Math.min(75, daysSinceTouch * 2);
    if (activeOrders > 0) score -= 18;
    if (lifeEventCount > 0) score -= 8;
    if (segment === LuxurySegment.VIC || segment === LuxurySegment.VVIP) score += 8;
    return Math.max(5, Math.min(95, score));
  }

  private nextTouch(lifeEvents: any[], risk: number) {
    const upcoming = lifeEvents.find((event) => event.eventDate >= new Date());
    if (upcoming)
      return `${this.toTitle(upcoming.eventType)} - ${upcoming.eventDate.toISOString().slice(0, 10)}`;
    if (risk >= 60) return 'Recovery follow-up required';
    return 'No scheduled milestone';
  }

  private nextActionForOrder(status: OrderStatusEnum) {
    const map: Partial<Record<OrderStatusEnum, string>> = {
      [OrderStatusEnum.CONFIRMED]: 'Confirm client expectation and reserve materials',
      [OrderStatusEnum.MATERIAL_RESERVED]: 'Confirm atelier start date',
      [OrderStatusEnum.IN_PRODUCTION]: 'Send production milestone update',
      [OrderStatusEnum.QC]: 'Prepare QC and delivery communication',
      [OrderStatusEnum.READY_TO_SHIP]: 'Confirm delivery or boutique handoff',
    };
    return map[status] ?? 'Review next client action';
  }

  private extractCity(address: unknown) {
    if (address && typeof address === 'object' && 'city' in address) {
      return String((address as any).city || 'Not captured');
    }
    return 'Not captured';
  }

  private initials(name: string) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  private formatCurrency(value: number, currency = 'VND') {
    return `${currency} ${Math.round(value).toLocaleString('en-US')}`;
  }

  private toTitle(value: string) {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private getCoverage(clients: any[]) {
    if (!clients.length) return '0%';
    const covered = clients.filter(
      (client) => client.nextTouch !== 'No scheduled milestone' || client.risk < 60,
    ).length;
    return `${Math.round((covered / clients.length) * 100)}%`;
  }

  private conciergeRegion(name: string) {
    const regions: Record<string, string> = {
      'S. Chen': 'APAC',
      'J. Dubois': 'LATAM / EU',
      'L. Muller': 'DACH',
      'P. Holt': 'UK',
    };
    return regions[name] ?? 'Maison';
  }
}
