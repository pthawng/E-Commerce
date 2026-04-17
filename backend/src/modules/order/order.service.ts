import { BadRequestException, Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ActionType, OrderStatusEnum, Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OwnershipRegistry } from '@modules/security/ownership.registry';
import { Principal, PrincipalType } from 'src/common/types/principal.types';
import { IOwnable } from 'src/common/interfaces/ownable.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatusValidator } from './utils/order-status.validator';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  private readonly SHIPPING_FEE = 30000;
  private readonly ORDER_CODE_PREFIX = 'ORD';

  constructor(
    private readonly prisma: PrismaService,
    private readonly ownershipRegistry: OwnershipRegistry,
  ) { }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * @deprecated Use OrderPaymentService.createOrderWithPayment instead.
   * Direct order creation via OrderService is forbidden to maintain system invariants.
   */
  async createOrder(
    userId: string | undefined,
    sessionId: string | undefined,
    dto: CreateOrderDto,
  ) {
    this.logger.error(
      `❌ Illegal attempt to call deprecated OrderService.createOrder! (UserId: ${userId}, SessionId: ${sessionId})`,
    );
    throw new BadRequestException(
      'This method is deprecated. Please use the modern checkout flow via OrderPaymentService.',
    );
  }

  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { productVariant: true },
        },
      },
    });
  }

  async getOrder(id: string, principal: Principal) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { productVariant: true },
        },
        transactions: true,
        shippingMethod: true,
        timelines: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

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
      }
    };

    this.ownershipRegistry.verify(principal, orderOwnable, `OrderDetailAccess:${id}`);

    return order;
  }

  // ============================================
  // ADMIN API
  // ============================================

  async findAllPaginated(dto: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sort?: string;
  }) {
    try {
      const page = Number(dto.page || 1);
      const limit = Number(dto.limit || 20);
      const { search, status, sort } = dto;
      const skip = (page - 1) * limit;

      const where: Prisma.OrderWhereInput = {};

      if (status) {
        where.status = status as any;
      }

      if (search) {
        where.OR = [
          { code: { contains: search, mode: 'insensitive' } },
          { shippingAddress: { path: ['fullName'], string_contains: search } },
        ];
      }

      // Sorting
      let orderBy: Prisma.OrderOrderByWithRelationInput = { createdAt: 'desc' };
      if (sort) {
        const [field, direction] = sort.split(':');
        orderBy = { [field]: direction as Prisma.SortOrder };
      }

      const [items, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            user: { select: { id: true, email: true, fullName: true } },
            _count: { select: { items: true } },
          },
        }),
        this.prisma.order.count({ where }),
      ]);

      return {
        items,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching paginated orders:', error);
      throw error;
    }
  }

  async updateStatus(id: string, status: string, actorId?: string, note?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Validate state transition
    const nextStatus = status as OrderStatusEnum;
    OrderStatusValidator.validate(id, order.status, nextStatus);

    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: nextStatus,
          // Auto-set timestamps based on status
          ...(status === OrderStatusEnum.confirmed ? { confirmedAt: new Date() } : {}),
          ...(status === OrderStatusEnum.shipping ? { shippedAt: new Date() } : {}),
          ...(status === OrderStatusEnum.delivered ? { deliveredAt: new Date() } : {}),
          ...(status === OrderStatusEnum.completed ? { completedAt: new Date() } : {}),
          ...(status === OrderStatusEnum.cancelled ? { cancelledAt: new Date() } : {}),
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: id,
          action: `STATUS_UPDATE_${status.toUpperCase()}`,
          fromStatus: order.status,
          toStatus: status as OrderStatusEnum,
          description: note || `Order status updated to ${status}`,
          actorId,
          actorType: actorId ? 'admin' : 'system',
        },
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
          actorType: 'admin',
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
      include: { inventoryItems: true, product: true },
    });

    return { cart, variants };
  }

  private validateCartItems(
    cartItems: Prisma.CartItemGetPayload<{}>[],
    variants: Prisma.ProductVariantGetPayload<{
      include: { inventoryItems: true; product: true };
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
      const totalStock = variant.inventoryItems.reduce(
        (acc, inv) => acc + inv.quantity - inv.reservedQuantity,
        0,
      );
      if (totalStock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${variant.sku}. Available: ${totalStock}`,
        );
      }

      // Check Price Mismatch
      if (Number(variant.price) !== Number(item.cachedPrice)) {
        priceMismatches.push({
          variantId: variant.id,
          sku: variant.sku,
          oldPrice: item.cachedPrice,
          newPrice: variant.price as any as Prisma.Decimal,
        });
      }
    }

    return priceMismatches;
  }

  private calculateOrderTotals(
    cartItems: Prisma.CartItemGetPayload<{}>[],
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
    cartItems: Prisma.CartItemGetPayload<{}>[],
    variants: Prisma.ProductVariantGetPayload<{ include: { inventoryItems: true } }>[],
    orderId: string,
    orderCode: string,
  ) {
    for (const item of cartItems) {
      const variant = variants.find((v) => v.id === item.productVariantId)!;
      let remainingToDeduct = item.quantity;

      // Simple warehouse selection: take from first available
      for (const inv of variant.inventoryItems) {
        if (remainingToDeduct <= 0) break;

        const available = inv.quantity - inv.reservedQuantity;
        if (available > 0) {
          const deduct = Math.min(available, remainingToDeduct);

          await tx.inventoryItem.update({
            where: { id: inv.id },
            data: { quantity: { decrement: deduct } },
          });

          await tx.inventoryLog.create({
            data: {
              inventoryItemId: inv.id,
              productVariantId: variant.id,
              warehouseId: inv.warehouseId,
              actionType: ActionType.SALE,
              quantityChange: -deduct,
              beforeQuantity: inv.quantity,
              afterQuantity: inv.quantity - deduct,
              referenceType: 'ORDER',
              referenceId: orderId,
              note: 'Order Checkout',
            },
          });

          remainingToDeduct -= deduct;
        }
      }

      if (remainingToDeduct > 0) {
        throw new BadRequestException(
          `Inventory sync failed: Insufficient stock for ${variant.sku} during checkout`,
        );
      }
    }
  }

  private generateOrderCode() {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const suffix = randomBytes(3).toString('hex').toUpperCase();
    return `${this.ORDER_CODE_PREFIX}-${date}-${suffix}`;
  }
}
