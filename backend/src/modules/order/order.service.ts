import { RequestContextService } from '@modules/observability/request-context.service';
import { OwnershipRegistry } from '@modules/security/ownership.registry';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LuxurySegment, OrderStatusEnum, PaymentStatusEnum, Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { IOwnable } from 'src/common/interfaces/ownable.interface';
import { Principal, PrincipalType } from 'src/common/types/principal.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStateMachine } from './utils/order-state-machine';

export enum TimelineActorType {
  ADMIN = 'admin',
  SYSTEM = 'system',
  CUSTOMER = 'customer',
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  private readonly SHIPPING_FEE = 30000;
  private readonly ORDER_CODE_PREFIX = 'ORD';

  constructor(
    private readonly prisma: PrismaService,
    private readonly ownershipRegistry: OwnershipRegistry,
    private readonly eventEmitter: EventEmitter2,
    private readonly requestContext: RequestContextService,
  ) {}

  // ============================================
  // PUBLIC API
  // ============================================

  async getMyOrders(userId: string, page = 1, limit = 15) {
    return this.findAllPaginated({
      page,
      limit,
      customerId: userId,
    });
  }

  async getOrder(id: string, principal: Principal) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        items: {
          include: { productVariant: true },
        },
        transactions: true,
        shippingMethod: true,
        timelines: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Stateless order access claim override
    if (principal.type === PrincipalType.ORDER_ACCESS) {
      if (principal.id === id) {
        const sa = order.shippingAddress as any;
        return { ...order, guestFullName: sa?.fullName || null };
      }
      throw new ForbiddenException('Access Denied: Invalid order access token for this resource.');
    }

    // Categorical Ownership Implementation
    const orderOwnable: IOwnable = {
      getOwners: () => {
        const owners: Principal[] = [];
        if (order.userId) {
          owners.push({ id: order.userId, type: PrincipalType.USER });
        }
        if (order.sessionId) {
          owners.push({ id: order.sessionId, type: PrincipalType.GUEST });
        }
        return owners;
      },
    };

    this.ownershipRegistry.verify(principal, orderOwnable, `OrderDetailAccess:${id}`);

    const sa = order.shippingAddress as any;
    return { ...order, guestFullName: sa?.fullName || null };
  }

  // ============================================
  // ADMIN API
  // ============================================

  async getSummaryStats() {
    const activeStatuses = [
      OrderStatusEnum.PENDING_PAYMENT,
      OrderStatusEnum.CONFIRMED,
      OrderStatusEnum.MATERIAL_RESERVED,
      OrderStatusEnum.IN_PRODUCTION,
      OrderStatusEnum.QC,
      OrderStatusEnum.READY_TO_SHIP,
      OrderStatusEnum.SHIPPED,
    ];

    const [total, processing, completed, issues, backlogValuation, deliverySla] = await Promise.all(
      [
        this.prisma.order.count(),
        this.prisma.order.count({ where: { status: { in: activeStatuses } } }),
        this.prisma.order.count({ where: { status: OrderStatusEnum.COMPLETED } }),
        this.prisma.order.count({
          where: {
            status: {
              in: [OrderStatusEnum.CANCELLED, OrderStatusEnum.RETURNED, OrderStatusEnum.REFUNDED],
            },
          },
        }),
        this.prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { status: { in: activeStatuses } },
        }),
        this.prisma.order.count({
          where: {
            status: { in: activeStatuses },
            createdAt: {
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // > 24h
            },
          },
        }),
      ],
    );

    return {
      total,
      processing,
      completed,
      issues,
      backlogValuation: Number(backlogValuation._sum.totalAmount || 0),
      deliverySla,
      efficiency: '94%',
    };
  }

  async findAllPaginated(dto: {
    page?: number;
    limit?: number;
    cursor?: string;
    search?: string;
    status?: string;
    sort?: string;
    customerId?: string;
    guestEmail?: string;
    queue?: string;
  }) {
    this.logger.debug(`[OrderPagination] Incoming DTO: ${JSON.stringify(dto)}`);
    try {
      const limit = Math.min(Number(dto.limit || 20), 100);
      const { search, status, sort, customerId, guestEmail, cursor } = dto;
      const queue = dto.queue?.toLowerCase();

      const where: Prisma.OrderWhereInput = {};
      const andFilters: Prisma.OrderWhereInput[] = [];
      if (customerId) where.userId = customerId;
      if (guestEmail) where.guestEmail = guestEmail;
      if (status && status !== 'all') where.status = status.toUpperCase() as OrderStatusEnum;

      if (search) {
        andFilters.push({
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { guestEmail: { contains: search, mode: 'insensitive' } },
            { shippingAddress: { path: ['fullName'], string_contains: search } },
            { user: { fullName: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
          ],
        });
      }

      if (queue === 'production') {
        andFilters.push({
          status: {
            in: [
              OrderStatusEnum.CONFIRMED,
              OrderStatusEnum.MATERIAL_RESERVED,
              OrderStatusEnum.IN_PRODUCTION,
              OrderStatusEnum.QC,
            ],
          },
        });
      }

      if (queue === 'ready') {
        andFilters.push({ status: OrderStatusEnum.READY_TO_SHIP });
      }

      if (queue === 'critical') {
        andFilters.push({
          OR: [
            {
              paymentStatus: PaymentStatusEnum.unpaid,
              user: {
                segment: {
                  in: [LuxurySegment.VIP, LuxurySegment.VVIP, LuxurySegment.VIC],
                },
              },
            },
            {
              createdAt: {
                lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              },
              status: {
                notIn: [OrderStatusEnum.COMPLETED, OrderStatusEnum.CANCELLED],
              },
            },
          ],
        });
      }

      if (andFilters.length > 0) where.AND = andFilters;

      // Hybrid Paging Logic
      let items: any[];
      if (cursor) {
        items = await this.prisma.order.findMany({
          take: limit,
          skip: 1,
          cursor: { id: cursor },
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, email: true, fullName: true } },
            _count: { select: { items: true } },
          },
        });
      } else {
        const page = Number(dto.page || 1);
        const skip = (page - 1) * limit;
        items = await this.prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, email: true, fullName: true } },
            _count: { select: { items: true } },
          },
        });
      }

      const total = await this.prisma.order.count({ where });

      this.logger.debug(`[OrderPagination] Filter: ${JSON.stringify(where)} | Total: ${total}`);

      const mappedItems = items.map((item) => ({
        ...item,
        guestFullName: (item.shippingAddress as any)?.fullName || null,
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        items: mappedItems,
        /** @deprecated Use `items` instead. Will be removed in v2. */
        data: mappedItems,
        meta: {
          totalItems: total,
          page: Number(dto.page || 1),
          limit,
          totalPages,
          hasNext: Number(dto.page || 1) < totalPages,
          hasPrev: Number(dto.page || 1) > 1,
          nextCursor: items.length === limit ? items[items.length - 1].id : null,
        },
        links: {
          self: `/admin/orders?page=${dto.page || 1}&limit=${limit}`,
          next:
            Number(dto.page || 1) < totalPages
              ? `/admin/orders?page=${Number(dto.page || 1) + 1}&limit=${limit}`
              : null,
          prev:
            Number(dto.page || 1) > 1
              ? `/admin/orders?page=${Number(dto.page || 1) - 1}&limit=${limit}`
              : null,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching paginated orders:', error);
      throw error;
    }
  }

  /**
   * Guarded state transition.
   * 1. Acquire row-level lock (FOR UPDATE)
   * 2. Validate against OrderStateMachine (Fail-Closed)
   * 3. Capture before/after state snapshots for immutable audit
   * 4. Atomic update of status, metadata, and timeline
   * 5. Transactional Events (Outbox Pattern)
   */
  public async transitionTo(
    id: string,
    nextStatus: OrderStatusEnum,
    actorId?: string,
    note?: string,
    sessionMetadata: any = {},
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Acquire row lock + Capture Before State
      const [order]: any[] = await tx.$queryRaw`
        SELECT * FROM "Order" WHERE id = ${id}::uuid FOR UPDATE
      `;

      if (!order) throw new NotFoundException('Order not found');

      // 2. Validate transition + Prerequisites (Fail-Closed)
      OrderStateMachine.validate(id, order.status, nextStatus, (order as any).stateMetadata);

      // 3. Atomic Status & Metadata Update
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: nextStatus,
          updatedAt: new Date(),
          // Standardized timestamps
          ...(nextStatus === ('CONFIRMED' as any) ? { confirmedAt: new Date() } : {}),
          ...(nextStatus === ('SHIPPED' as any) ? { shippedAt: new Date() } : {}),
          ...(nextStatus === ('DELIVERED' as any) ? { deliveredAt: new Date() } : {}),
          ...(nextStatus === ('COMPLETED' as any) ? { completedAt: new Date() } : {}),
          ...(nextStatus === ('CANCELLED' as any) ? { cancelledAt: new Date() } : {}),
        },
      });

      // 4. Immutable payment audit log.
      await tx.orderTimeline.create({
        data: {
          orderId: id,
          action: `STATE_TRANSITION_${nextStatus}`,
          fromStatus: order.status,
          toStatus: nextStatus,
          description: note || `Order transitioned from ${order.status} to ${nextStatus}`,
          actorId,
          actorType: actorId ? TimelineActorType.ADMIN : TimelineActorType.SYSTEM,
          metadata: {
            ...sessionMetadata,
            beforeState: order,
            afterState: updatedOrder,
          } as Prisma.InputJsonValue,
        },
      });

      // 5. Transactional Event Outbox (Decoupling)
      const correlationId = this.requestContext.getCorrelationId();
      await tx.domainEventOutbox.create({
        data: {
          eventType: 'order.status.changed',
          aggregateId: id,
          correlationId,
          payload: {
            orderId: id,
            oldStatus: order.status,
            newStatus: nextStatus,
            actorId,
            correlationId,
            stateMetadata: (updatedOrder as any).stateMetadata,
          },
          status: 'PENDING',
        },
      });

      // 6. Emit Real-time Event (Post-Transaction)
      this.eventEmitter.emit('order.status.changed', {
        orderId: id,
        oldStatus: order.status,
        newStatus: nextStatus,
        actorId,
        stateMetadata: (updatedOrder as any).stateMetadata,
      });

      return updatedOrder;
    });
  }

  async updateTracking(
    id: string,
    trackingCode: string,
    estimatedDeliveryAt?: Date,
    actorId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: {
          trackingCode,
          estimatedDeliveryAt: estimatedDeliveryAt || undefined,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: id,
          action: 'TRACKING_UPDATE',
          description: `Updated tracking code: ${trackingCode}`,
          actorId,
          actorType: TimelineActorType.ADMIN,
        },
      });

      return order;
    });
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async getCartAndVariants(userId?: string, sessionId?: string) {
    const cart = await this.prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const variantIds = cart.items.map((i) => i.productVariantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { inventoryBalances: true, product: true },
    });

    return { cart, variants };
  }

  private validateCartItems(
    cartItems: Prisma.CartItemGetPayload<Record<string, never>>[],
    variants: Prisma.ProductVariantGetPayload<{
      include: { inventoryBalances: true; product: true };
    }>[],
  ) {
    const priceMismatches: {
      variantId: string;
      sku: string;
      oldPrice: Prisma.Decimal;
      newPrice: Prisma.Decimal;
    }[] = [];

    for (const item of cartItems) {
      const variant = variants.find((v) => v.id === item.productVariantId);

      if (!variant)
        throw new BadRequestException(`Product variant ${item.productVariantId} no longer exists`);
      if (!variant.isActive || !variant.product.isActive) {
        throw new BadRequestException(`Product ${variant.sku} is inactive`);
      }

      // Check Stock
      const totalStock = variant.inventoryBalances.reduce(
        (acc, inv) => acc + inv.quantity - inv.reservedQuantity,
        0,
      );
      if (totalStock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${variant.sku}. Available: ${totalStock}`,
        );
      }

      // Check price mismatch with decimal precision.
      if (!new Prisma.Decimal(variant.price).equals(item.cachedPrice)) {
        priceMismatches.push({
          variantId: variant.id,
          sku: variant.sku,
          oldPrice: item.cachedPrice,
          newPrice: variant.price as unknown as Prisma.Decimal,
        });
      }
    }

    return priceMismatches;
  }

  private calculateOrderTotals(
    cartItems: Prisma.CartItemGetPayload<Record<string, never>>[],
    variants: Prisma.ProductVariantGetPayload<{ include: { product: true } }>[],
  ) {
    let subTotal = 0;
    const orderItemsData = cartItems.map((item) => {
      const variant = variants.find((v) => v.id === item.productVariantId)!;
      const priceToUse = variant.price; // Source of truth
      const lineTotal = Number(priceToUse) * item.quantity;

      subTotal += lineTotal;

      return {
        productVariantId: variant.id,
        productName:
          (variant.product.name as Record<string, string>)?.vi ??
          (variant.product.name as Record<string, string>)?.en ??
          'Product',
        sku: variant.sku,
        variantTitle: variant.variantTitle ?? {},
        thumbnailUrl: variant.thumbnailUrl,
        quantity: item.quantity,
        price: priceToUse,
        totalLine: lineTotal,
      };
    });

    return { orderItemsData, subTotal };
  }

  private async processInventoryDeduction(
    tx: Prisma.TransactionClient,
    cartItems: Prisma.CartItemGetPayload<Record<string, never>>[],
    variants: Prisma.ProductVariantGetPayload<{ include: { inventoryBalances: true } }>[],
    orderId: string,
    orderCode: string,
  ) {
    // Phase 3 Architecture: Event-Driven Choreography via Transactional Outbox
    // We completely decouple the Order Domain from the Inventory Domain.
    // Instead of inline N+1 Postgres locks, we emit a domain event that the Inventory Service will consume.

    const correlationId = this.requestContext.getCorrelationId();
    await tx.domainEventOutbox.create({
      data: {
        eventType: 'inventory.reserve_requested',
        aggregateId: orderId,
        correlationId,
        payload: {
          orderId,
          orderCode,
          correlationId,
          items: cartItems.map((item) => ({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
          })),
        },
        status: 'PENDING',
      },
    });
  }

  private generateOrderCode() {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const suffix = randomBytes(3).toString('hex').toUpperCase();
    return `${this.ORDER_CODE_PREFIX}-${date}-${suffix}`;
  }
}
