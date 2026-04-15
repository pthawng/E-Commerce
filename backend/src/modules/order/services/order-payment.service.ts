import { SystemContextStore } from '@common/context/system-context.store';
import { PaymentService } from '@modules/payment/payment.service';
import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatusEnum, PaymentMethodEnum, Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { InventoryAllocatorService } from '../../inventory/inventory-allocator.service';
import { InventoryService } from '../../inventory/inventory.service';
import { MailService } from '../../mail/mail.service';
import { CreateOrderWithPaymentDto } from '../dto/create-order-with-payment.dto';
import { OrderPaymentResponseDto } from '../dto/order-payment-response.dto';
import { PaymentFlowStatus } from '../enums/payment-flow-status.enum';
import { OrderStatusValidator } from '../utils/order-status.validator';
import { CheckoutTokenService } from './checkout-token.service';

/**
 * OrderPaymentService
 *
 * Core orchestrator for Order-Payment integration flow.
 * Enforces Staff-level invariants and state-machine transitions.
 */
@Injectable()
export class OrderPaymentService {
  private readonly logger = new Logger(OrderPaymentService.name);
  private readonly PAYMENT_TIMEOUT_MINUTES = 15;
  private readonly ORDER_CODE_PREFIX = 'ORD';
  private readonly SHIPPING_FEE = 30000; // VND

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly inventoryService: InventoryService,
    private readonly inventoryAllocator: InventoryAllocatorService,
    private readonly checkoutTokenService: CheckoutTokenService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Step 1: Validate cart and reserve inventory (snapshot)
   */
  async validateCheckout(
    userId?: string,
    sessionId?: string,
  ): Promise<{ checkoutToken: string; snapshot: { items: any[]; totals: any }; expiresAt: Date }> {
    return SystemContextStore.asInternal('OrderPaymentService', async () => {
      this.logger.log(`Validating checkout for userId=${userId}, sessionId=${sessionId}`);

      const { cart, variants } = await this.getCartAndVariants(userId, sessionId);

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      const allocations = await this.inventoryAllocator.allocate(
        cart.items.map((item) => ({
          variantId: item.productVariantId,
          quantity: item.quantity,
        })),
      );

      const { totals } = this.calculateOrderTotals(cart.items, variants);
      const expiresAt = new Date(Date.now() + this.PAYMENT_TIMEOUT_MINUTES * 60 * 1000);
      const cartHash = this.generateCartHash(cart.items);

      const checkoutToken = await this.checkoutTokenService.generateToken({
        cartHash,
        userId,
        sessionId,
        totalAmount: totals.total,
        currency: 'VND',
        lineItems: cart.items.map((item) => ({
          variantId: item.productVariantId,
          quantity: item.quantity,
          price: Number(variants.find((v) => v.id === item.productVariantId)?.price || 0),
        })),
      });

      return {
        checkoutToken,
        snapshot: {
          items: cart.items.map((item) => ({
            variantId: item.productVariantId,
            quantity: item.quantity,
            price: Number(variants.find((v) => v.id === item.productVariantId)?.price || 0),
          })),
          totals,
        },
        expiresAt,
      };
    });
  }

  /**
   * Step 2: Create order with payment integration
   */
  async createOrderWithPayment(
    dto: CreateOrderWithPaymentDto,
    userId?: string,
    sessionId?: string,
  ): Promise<OrderPaymentResponseDto> {
    return SystemContextStore.asInternal('OrderPaymentService', async () => {
      this.logger.log(`Creating order: method=${dto.paymentMethod}, userId=${userId}`);

      // 1. Verify checkout token FIRST to get authoritative jti
      const tokenPayload = await this.checkoutTokenService.verifyToken(dto.checkoutToken);
      const idempotencyKey = tokenPayload.jti; // Use JTI from token as definitive key

      // 2. Global Idempotency Check using authoritative JTI
      const existingOrder = await this.prisma.order.findUnique({
        where: { idempotencyKey },
        include: { transactions: true },
      });
      if (existingOrder) {
        this.logger.warn(
          `Idempotent request for JTI ${idempotencyKey}: returning existing order ${existingOrder.code}`,
        );
        return this.buildOrderPaymentResponse(
          existingOrder,
          existingOrder.transactions[0],
          null,
          false,
        );
      }

      // Safety check: token ownership
      if (tokenPayload.userId && tokenPayload.userId !== userId) {
        throw new BadRequestException('Checkout token ownership mismatch (User)');
      }
      if (!tokenPayload.userId && tokenPayload.sessionId !== sessionId) {
        throw new BadRequestException('Checkout token ownership mismatch (Session)');
      }

      // 2. Fetch cart and variants
      const { cart, variants } = await this.getCartAndVariants(userId, sessionId);

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      // 3. Verify cart state and PRICE stability hasn't changed since token generation
      const currentCartHash = this.generateCartHash(cart.items);
      if (currentCartHash !== tokenPayload.cartHash) {
        throw new ConflictException({
          code: 'CART_HASH_MISMATCH',
          message: 'Cart content has changed. Please re-validate checkout.',
        });
      }

      const { orderItemsData, totals } = this.calculateOrderTotals(
        cart.items,
        variants,
        dto.shippingMethodId,
      );

      // Staff-level: Enforce Price Concurrency Safety (Integer-safe VND comparison)
      // We check the TOTAL first, then individual items for forensic debugging
      const isPriceSafe = Math.abs(Math.round(totals.total) - Math.round(tokenPayload.totalAmount)) <= 1;

      if (!isPriceSafe) {
        this.logger.warn(`Price mismatch detected for token ${tokenPayload.jti}. Expected: ${tokenPayload.totalAmount}, Actual: ${totals.total}`);
        throw new ConflictException({
          code: 'PRICE_STABILITY_ERROR',
          message: 'Price has changed since validation. Please review your order totals.',
          details: {
            expected: tokenPayload.totalAmount,
            actual: totals.total,
          },
        });
      }

      // Verify individual items to catch edge cases (e.g. price shifts that sum to same total)
      for (const item of cart.items) {
        const variant = variants.find((v) => v.id === item.productVariantId);
        const snapshotItem = tokenPayload.lineItems.find((li) => li.variantId === item.productVariantId);

        const currentPrice = Math.round(Number(variant?.price || 0));
        const snapshotPrice = Math.round(snapshotItem?.price || 0);

        if (currentPrice !== snapshotPrice) {
          throw new ConflictException({
            code: 'PRICE_STABILITY_ERROR',
            message: `The price for ${variant?.sku || 'an item'} has changed.`,
          });
        }
      }

      // 4. Allocate inventory
      const allocations = await this.inventoryAllocator.allocate(
        cart.items.map((item) => ({
          variantId: item.productVariantId,
          quantity: item.quantity,
        })),
      );

      const paymentDeadline = new Date(Date.now() + this.PAYMENT_TIMEOUT_MINUTES * 60 * 1000);

      try {
        const result = await this.prisma.$transaction(async (tx) => {
          // 4a. Create order with status 'pending_payment'
          const order = await this.createOrder(tx, {
            userId,
            sessionId: userId ? null : sessionId,
            dto,
            orderItemsData,
            subTotal: totals.subtotal,
            totalAmount: totals.total,
            status: OrderStatusEnum.pending_payment,
            paymentDeadline,
            idempotencyKey, // Secure JTI
          });

          // 4b. Reserve inventory with State: ACTIVE
          await this.inventoryService.reserve(
            order.id,
            allocations,
            paymentDeadline,
            tx,
            userId,
            sessionId,
          );

          // 4c. Create payment transaction (INIT)
          const payment = await this.createPaymentTransaction(tx, {
            orderId: order.id,
            amount: totals.total,
            provider: dto.paymentMethod,
            status: 'pending',
          });

          // 4d. Audit Trail: Event RECORDED
          await tx.orderTimeline.create({
            data: {
              orderId: order.id,
              action: 'ORDER_INITIATED',
              description: `Order created with payment method ${dto.paymentMethod}`,
              metadata: { idempotencyKey },
            },
          });

          return { order, payment };
        });

        // Step 5: Generate payment URL
        let paymentUrl: string | null = null;
        if (dto.paymentMethod !== 'VIETQR') {
          try {
            paymentUrl = await this.paymentService.generatePaymentUrl(
              result.order.id,
              result.order.code,
              totals.total,
              dto.paymentMethod,
              dto.returnUrl,
              dto.cancelUrl,
            );
          } catch (error) {
            this.logger.error('Failed to initiate payment gateway', error);
            await this.cancelOrderAndReleaseInventory(result.order.id, 'Payment initiation failed');
            throw new BadRequestException('Failed to initiate payment gateway');
          }
        }

        return this.buildOrderPaymentResponse(
          result.order,
          result.payment,
          paymentUrl,
          dto.paymentMethod === 'VIETQR',
        );
      } catch (error) {
        this.logger.error('Failed to create order with payment pipeline', error);
        throw error;
      }
    });
  }

  async confirmOrder(orderId: string): Promise<void> {
    return SystemContextStore.asInternal('OrderPaymentService', async () => {
      this.logger.log(`Confirming order: ${orderId}`);

      await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });

        if (!order || order.status === OrderStatusEnum.confirmed) return;

        OrderStatusValidator.validate(orderId, order.status, OrderStatusEnum.confirmed);

        // Staff-level: Deduct (Reserve -> Confirm)
        await this.inventoryService.deduct(orderId, tx);

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatusEnum.confirmed,
            paymentStatus: 'paid',
            confirmedAt: new Date(),
          },
        });

        await tx.orderTimeline.create({
          data: {
            orderId,
            action: 'PAYMENT_SUCCESS_CONFIRMED',
            fromStatus: order.status,
            toStatus: OrderStatusEnum.confirmed,
            description: 'Order confirmed after successful payment verification',
            actorType: 'system',
          },
        });

        // Production Pattern: Clear Cart ONLY on success
        await tx.cart.deleteMany({
          where: order.userId ? { userId: order.userId } : { sessionId: order.sessionId },
        });

        // L8 Email Integration: Atomic Outbox Trigger
        // We fetch the full order with items and user to ensure template context is rich.
        const fullOrder = await tx.order.findUnique({
          where: { id: orderId },
          include: {
            items: true,
            user: { select: { email: true, fullName: true } },
          },
        });

        if (!fullOrder) {
          this.logger.warn(`Order ${orderId} not found for confirmation email trigger`);
          return;
        }

        const recipientEmail = fullOrder?.user?.email || (fullOrder?.shippingAddress as any)?.email;
        if (recipientEmail) {
          await this.mailService.sendMail(
            {
              to: recipientEmail,
              subject: `Order Confirmation - ${fullOrder.code}`,
              template: 'order-confirmation',
              eventType: 'order.confirmed',
              idempotencyKey: `order_confirm_${fullOrder.id}`,
              context: {
                orderCode: fullOrder.code,
                customerName:
                  fullOrder.user?.fullName ||
                  (fullOrder.shippingAddress as any)?.fullName ||
                  'Valued Customer',
                items: fullOrder.items.map((item) => ({
                  name: item.productName,
                  quantity: item.quantity,
                  price: Number(item.price).toLocaleString('vi-VN'),
                  total: Number(item.totalLine).toLocaleString('vi-VN'),
                })),
                totalAmount: Number(fullOrder.totalAmount).toLocaleString('vi-VN'),
                shippingFee: Number(fullOrder.shippingFee).toLocaleString('vi-VN'),
                currency: 'VND',
                orderUrl: `${this.configService.get('FRONTEND_URL')}/me/orders/${fullOrder.id}`,
              },
            },
            tx,
          );
        } else {
          this.logger.warn(`No recipient email found for order confirmation ${orderId}`);
        }
      });
    });
  }

  async cancelOrder(orderId: string, reason: string): Promise<void> {
    return SystemContextStore.asInternal('OrderPaymentService', async () => {
      await this.cancelOrderAndReleaseInventory(orderId, reason);
    });
  }

  private async getCartAndVariants(userId?: string, sessionId?: string) {
    const cart = await this.prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) return { cart: null, variants: [] };

    const variantIds = cart.items.map((item) => item.productVariantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: { select: { name: true, isActive: true } },
      },
    });

    return { cart, variants };
  }

  private calculateOrderTotals(items: any[], variants: any[], shippingMethodId?: string) {
    const orderItemsData = items.map((item) => {
      const variant = variants.find((v) => v.id === item.productVariantId);
      const price = Number(variant.price);
      return {
        productVariantId: variant.id,
        productName:
          typeof variant.product.name === 'string'
            ? variant.product.name
            : variant.product.name.en || variant.product.name.vi || 'Product',
        sku: variant.sku,
        variantTitle: variant.variantTitle || {},
        thumbnailUrl: variant.thumbnailUrl,
        quantity: item.quantity,
        price,
        totalLine: price * item.quantity,
      };
    });

    const subtotal = orderItemsData.reduce((sum, item) => sum + item.totalLine, 0);
    const total = subtotal + this.SHIPPING_FEE;

    return { orderItemsData, totals: { subtotal, total, shipping: this.SHIPPING_FEE } };
  }

  private async createOrder(tx: Prisma.TransactionClient, params: any) {
    const orderCode = this.generateOrderCode();
    return tx.order.create({
      data: {
        code: orderCode,
        userId: params.userId,
        sessionId: params.sessionId,
        status: params.status,
        paymentStatus: 'unpaid',
        paymentMethod: params.dto.paymentMethod as PaymentMethodEnum,
        paymentDeadline: params.paymentDeadline,
        shippingAddress: params.dto.shippingAddress,
        billingAddress: params.dto.billingAddress || params.dto.shippingAddress,
        shippingMethodId: params.dto.shippingMethodId,
        currency: 'VND',
        subTotal: params.subTotal,
        shippingFee: this.SHIPPING_FEE,
        totalAmount: params.totalAmount,
        note: params.dto.note,
        idempotencyKey: params.dto.idempotencyKey,
        items: { create: params.orderItemsData },
      },
      include: { items: true },
    });
  }

  private async createPaymentTransaction(tx: Prisma.TransactionClient, params: any) {
    return tx.paymentTransaction.create({
      data: {
        orderId: params.orderId,
        amount: params.amount,
        currency: 'VND',
        type: 'payment',
        status: params.status,
        provider: params.provider,
        transactionCode: this.generateTransactionCode(),
      },
    });
  }

  private async cancelOrderAndReleaseInventory(orderId: string, reason?: string) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order || order.status === OrderStatusEnum.cancelled) return;

      // Release (Restore stock)
      await this.inventoryService.release(orderId, tx);

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatusEnum.cancelled,
          cancelReason: reason || 'Payment failed',
          cancelledAt: new Date(),
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          action: 'ORDER_CANCELLED',
          description: reason || 'Order cancelled by system flow',
        },
      });

      await tx.paymentTransaction.updateMany({
        where: { orderId },
        data: { status: 'failed' },
      });
    });
  }

  private generateCartHash(items: any[]): string {
    const sortedItems = [...items].sort((a, b) =>
      a.productVariantId.localeCompare(b.productVariantId),
    );
    const content = sortedItems.map((i) => `${i.productVariantId}:${i.quantity}`).join('|');
    return createHash('sha256').update(content).digest('hex');
  }

  private buildOrderPaymentResponse(
    order: any,
    payment: any,
    paymentUrl: string | null,
    isVietQR: boolean,
  ): OrderPaymentResponseDto {
    return {
      order: {
        id: order.id,
        code: order.code,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentDeadline: order.paymentDeadline,
        totalAmount: Number(order.totalAmount),
        currency: order.currency,
        createdAt: order.createdAt,
      },
      payment: {
        id: payment?.id,
        paymentUrl,
        transactionCode: payment?.transactionCode,
        provider: payment?.provider,
        status: payment?.status,
      },
      flowStatus: PaymentFlowStatus.PENDING_PAYMENT,
      message: 'Order created. Please complete payment.',
    };
  }

  private generateOrderCode() {
    return `${this.ORDER_CODE_PREFIX}-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }
  private generateTransactionCode() {
    return `TXN-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }
}
