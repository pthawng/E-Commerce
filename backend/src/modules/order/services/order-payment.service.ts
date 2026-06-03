import { SystemContextStore } from '@common/context/system-context.store';
import { GuestVerificationService } from '@modules/auth/services/guest-verification.service';
import { PaymentService } from '@modules/payment/payment.service';
import { CurrencyService } from '@modules/system/currency.service';
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OrderStatusEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
  Prisma,
  TransactionStatusEnum,
} from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { InventoryAllocatorService } from '../../inventory/inventory-allocator.service';
import { InventoryService } from '../../inventory/inventory.service';
import { MailService } from '../../mail/mail.service';
import { SystemSettingService } from '../../system/system-setting.service';
import { AdminCreateOrderDto } from '../dto/admin-create-order.dto';
import { CreateOrderWithPaymentDto } from '../dto/create-order-with-payment.dto';
import { OrderPaymentResponseDto } from '../dto/order-payment-response.dto';
import { PaymentFlowStatus } from '../enums/payment-flow-status.enum';
import { CheckoutTokenService } from './checkout-token.service';
import { CheckoutValidator } from './checkout-validator.service';
import { PriceEngineService } from './price-engine.service';

/**
 * Internal type extension for Prisma order operations.
 * Resolves type compatibility constraints for exchange rates and currency fields.
 */
type HardenedOrderCreateInput = Prisma.OrderCreateInput & {
  exchangeRate: number | Prisma.Decimal;
  displayCurrency: string;
};

type HardenedOrderDelegate = {
  create: (args: { data: HardenedOrderCreateInput; include?: any }) => Promise<any>;
};

type HardenedTx = Prisma.TransactionClient & {
  order: HardenedOrderDelegate;
};

/**
 * Order payment service.
 * Handles the core orchestration of order and payment integration flow.
 */
@Injectable()
export class OrderPaymentService {
  private readonly logger = new Logger(OrderPaymentService.name);
  private readonly ORDER_CODE_PREFIX = 'ORD';

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    private readonly inventoryService: InventoryService,
    private readonly inventoryAllocator: InventoryAllocatorService,
    private readonly checkoutTokenService: CheckoutTokenService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly guestVerificationService: GuestVerificationService,
    private readonly jwtService: JwtService,
    private readonly currencyService: CurrencyService,
    private readonly priceEngine: PriceEngineService,
    private readonly checkoutValidator: CheckoutValidator,
    private readonly settings: SystemSettingService,
  ) {}

  /**
   * Validates checkout cart and reserves inventory snapshot.
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

      const shippingFee = await this.getShippingFeeVnd();
      const paymentTimeoutMinutes = await this.getPaymentTimeoutMinutes();
      const { totals } = this.calculateOrderTotals(cart.items, variants, undefined, shippingFee);
      const expiresAt = new Date(Date.now() + paymentTimeoutMinutes * 60 * 1000);
      const cartHash = this.checkoutValidator.generateCartHash(cart.items);

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
   * Creates an order with payment integration.
   */
  async createOrderWithPayment(
    dto: CreateOrderWithPaymentDto,
    userId?: string,
    sessionId?: string,
  ): Promise<OrderPaymentResponseDto> {
    return SystemContextStore.asInternal('OrderPaymentService', async () => {
      this.logger.log(`Creating order: method=${dto.paymentMethod}, userId=${userId}`);

      // Validate guest token and verify checkout token ownership
      await this.checkoutValidator.validateGuest(dto.guestEmail, dto.guestVerifyToken);

      const tokenPayload = await this.checkoutTokenService.verifyToken(dto.checkoutToken);
      this.checkoutValidator.validateTokenOwnership(tokenPayload, userId, sessionId);

      const idempotencyKey = tokenPayload.jti;

      // Check request idempotency using the token identifier
      const existingOrder = await this.prisma.order.findUnique({
        where: { idempotencyKey },
        include: { transactions: true },
      });
      if (existingOrder) {
        this.logger.warn(`Idempotent request for JTI ${idempotencyKey}: returning existing order`);
        const paymentUrl = await this.resolveExistingPaymentUrl(existingOrder, dto);
        return this.buildOrderPaymentResponse(
          existingOrder,
          existingOrder.transactions[0],
          paymentUrl,
          existingOrder.paymentMethod === PaymentMethodEnum.VIETQR,
        );
      }

      // Retrieve current cart status and validate against token snapshot
      const { cart, variants } = await this.getCartAndVariants(userId, sessionId);
      if (!cart || cart.items.length === 0) throw new BadRequestException('Cart is empty');

      this.checkoutValidator.validateCartStability(cart.items, tokenPayload.cartHash);

      const shippingFee = await this.getShippingFeeVnd();
      const paymentTimeoutMinutes = await this.getPaymentTimeoutMinutes();
      const { orderItemsData, totals } = this.calculateOrderTotals(
        cart.items,
        variants,
        dto.shippingMethodId,
        shippingFee,
      );

      this.checkoutValidator.validatePriceStability(
        totals.total,
        tokenPayload.totalAmount,
        orderItemsData,
        tokenPayload.lineItems,
      );

      // Create order record and reserve inventory inside transaction
      const paymentDeadline = new Date(Date.now() + paymentTimeoutMinutes * 60 * 1000);
      const targetCurrency = dto.paymentMethod === PaymentMethodEnum.PAYPAL ? 'USD' : 'VND';
      const exchangeRate = await this.currencyService.getRate(targetCurrency);

      const allocations = await this.inventoryAllocator.allocate(
        cart.items.map((item) => ({ variantId: item.productVariantId, quantity: item.quantity })),
      );

      const result = await this.createOrderReservationAndPayment({
        userId,
        sessionId,
        dto,
        orderItemsData,
        totals,
        paymentDeadline,
        idempotencyKey,
        exchangeRate,
        displayCurrency: targetCurrency,
        allocations,
        cartItems: cart.items,
        shippingFee,
      });

      // Integrate with payment gateway provider
      let paymentUrl: string | null = null;
      if (dto.paymentMethod !== PaymentMethodEnum.VIETQR) {
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
          this.logger.error(`[Saga] Payment Gateway failure for Order ${result.order.id}`, error);
          // Revert order status and release inventory if the payment gateway is unreachable
          await this.cancelOrderAndReleaseInventory(result.order.id, 'Payment gateway unreachable');
          throw new BadRequestException('Payment system currently unavailable. Order cancelled.');
        }
      }

      // Generate access token and build response
      const orderAccessToken = await this.jwtService.signAsync(
        { orderId: result.order.id, sub: 'order_access' },
        { secret: this.configService.get('JWT_CHECKOUT_SECRET'), expiresIn: '1h' },
      );

      return this.buildOrderPaymentResponse(
        result.order,
        result.payment,
        paymentUrl,
        dto.paymentMethod === PaymentMethodEnum.VIETQR,
        orderAccessToken,
      );
    });
  }

  async confirmOrder(orderId: string, tx?: Prisma.TransactionClient): Promise<void> {
    return SystemContextStore.asInternal('OrderPaymentService', async () => {
      this.logger.log(`Confirming order: ${orderId}`);

      const executeInTransaction = async (currentTx: Prisma.TransactionClient) => {
        // Lock the order record to prevent race conditions during concurrent updates
        const orders = await currentTx.$queryRaw<any[]>`
          SELECT *
          FROM "Order"
          WHERE "id" = ${orderId}
          FOR UPDATE
        `;
        const order = orders[0];

        if (!order) {
          this.logger.warn(`Order ${orderId} not found during confirmation attempt.`);
          return;
        }

        // Skip processing if the order is already confirmed. Inventory was already committed.
        if (order.status === OrderStatusEnum.CONFIRMED) {
          this.logger.log(`Order ${orderId} already confirmed. Skipping.`);
          return;
        }

        if (order.status !== OrderStatusEnum.PENDING_PAYMENT) {
          throw new ConflictException({
            code: 'ORDER_NOT_PAYABLE',
            message: `Cannot confirm payment for order=${orderId} in status=${order.status}`,
          });
        }

        if (order.paymentStatus !== PaymentStatusEnum.unpaid) {
          throw new ConflictException({
            code: 'ORDER_PAYMENT_STATUS_NOT_PAYABLE',
            message: `Cannot confirm payment for order=${orderId} with paymentStatus=${order.paymentStatus}`,
          });
        }

        // Deduct inventory items
        await this.inventoryService.deduct(orderId, currentTx);

        // Update Order Status and Version
        const updatedOrder = await currentTx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatusEnum.CONFIRMED,
            paymentStatus: PaymentStatusEnum.paid,
            confirmedAt: new Date(),
            version: { increment: 1 },
          },
        });

        // Create audit trail entry for status change
        await currentTx.orderTimeline.create({
          data: {
            orderId,
            action: 'PAYMENT_SUCCESS_CONFIRMED',
            fromStatus: order.status,
            toStatus: OrderStatusEnum.CONFIRMED,
            description: 'Order confirmed after successful payment verification',
            actorType: 'system',
            metadata: { version: updatedOrder.version },
          },
        });

        // Send order confirmation email
        const recipientEmail = order.userId
          ? (
              await currentTx.user.findUnique({
                where: { id: order.userId },
                select: { email: true },
              })
            )?.email
          : order.guestEmail;

        if (recipientEmail) {
          const items = await currentTx.orderItem.findMany({ where: { orderId } });

          await this.mailService.sendMail(
            {
              to: recipientEmail,
              subject: `Order Confirmation - ${order.code}`,
              template: 'order-confirmation',
              eventType: 'order.confirmed',
              idempotencyKey: `order_confirm_${order.id}_v${updatedOrder.version}`,
              context: {
                orderCode: order.code,
                customerName: (order.shippingAddress as any)?.fullName || 'Valued Customer',
                orderDate: new Intl.DateTimeFormat('vi-VN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: 'Asia/Ho_Chi_Minh',
                }).format(order.createdAt),
                shippingAddress: [
                  (order.shippingAddress as any)?.addressDetail,
                  (order.shippingAddress as any)?.wardName,
                  (order.shippingAddress as any)?.districtName,
                  (order.shippingAddress as any)?.provinceName,
                ]
                  .filter(Boolean)
                  .join(', '),
                customerPhone: (order.shippingAddress as any)?.phone || 'N/A',
                items: items.map((item) => ({
                  name: item.productName,
                  quantity: item.quantity,
                  price: Number(item.price).toLocaleString('vi-VN'),
                  total: Number(item.totalLine).toLocaleString('vi-VN'),
                  currency: 'VND',
                })),
                totalAmount: Number(order.totalAmount).toLocaleString('vi-VN'),
                shippingFee: Number(order.shippingFee).toLocaleString('vi-VN'),
                currency: 'VND',
                orderUrl: `${this.configService.get('FRONTEND_URL')}/payment-result?orderId=${order.id}`,
              },
            },
            currentTx,
          );
        }

        // Clear cart items for the user session
        await currentTx.cart.deleteMany({
          where: order.userId ? { userId: order.userId } : { sessionId: order.sessionId },
        });
      };

      if (tx) {
        await executeInTransaction(tx);
      } else {
        await this.prisma.$transaction(async (newTx) => {
          await executeInTransaction(newTx);
        });
      }
    });
  }

  async cancelOrder(orderId: string, reason?: string, actorId?: string): Promise<any> {
    return SystemContextStore.asInternal('OrderPaymentService', async () => {
      return this.cancelOrderAndReleaseInventory(orderId, reason, actorId);
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

  private calculateOrderTotals(
    items: any[],
    variants: any[],
    shippingMethodId?: string,
    shippingFee?: number,
  ) {
    const itemsForEngine = items.map((item) => {
      const variant = variants.find((v) => v.id === item.productVariantId);
      return { price: Number(variant.price), quantity: item.quantity };
    });

    const totals = this.priceEngine.calculateTotals({
      items: itemsForEngine,
      shippingFee,
    });

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

    return {
      orderItemsData,
      totals: {
        subtotal: totals.subtotal,
        total: totals.total,
        shipping: totals.shipping,
        tax: totals.tax,
        discount: totals.discount,
      },
    };
  }

  private assertPricingInvariant(params: {
    subTotal: number;
    shippingFee: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
  }) {
    const expected =
      params.subTotal + params.shippingFee + params.taxAmount - params.discountAmount;
    const drift = Math.abs(expected - params.totalAmount);
    if (drift > 1) {
      throw new ConflictException({
        code: 'PRICING_INVARIANT_VIOLATION',
        message: `Order total drift detected: expected=${expected}, actual=${params.totalAmount}, drift=${drift}`,
      });
    }
  }

  private async createOrder(tx: Prisma.TransactionClient, params: any) {
    const hardenedTx = tx as HardenedTx;

    this.assertPricingInvariant({
      subTotal: params.subTotal,
      shippingFee: params.shippingFee,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: params.totalAmount,
    });

    const orderCode = this.generateOrderCode();
    return hardenedTx.order.create({
      data: {
        code: orderCode,
        user: params.userId ? { connect: { id: params.userId } } : undefined,
        sessionId: params.sessionId,
        guestEmail: params.dto.guestEmail,
        status: params.status,
        paymentStatus: 'unpaid',
        paymentMethod: params.dto.paymentMethod as PaymentMethodEnum,
        paymentDeadline: params.paymentDeadline,
        shippingAddress: params.dto.shippingAddress,
        billingAddress: params.dto.billingAddress || params.dto.shippingAddress,
        currency: 'VND',
        subTotal: params.subTotal,
        shippingFee: params.shippingFee,
        totalAmount: params.totalAmount,
        note: params.dto.note,
        idempotencyKey: params.idempotencyKey,
        exchangeRate: params.exchangeRate,
        displayCurrency: params.displayCurrency,
        version: 1,
        items: { create: params.orderItemsData },
      },
      include: { items: true },
    });
  }

  private async createOrderReservationAndPayment(params: {
    userId?: string;
    sessionId?: string;
    dto: CreateOrderWithPaymentDto;
    orderItemsData: any[];
    totals: any;
    paymentDeadline: Date;
    idempotencyKey: string;
    exchangeRate: number | Prisma.Decimal;
    displayCurrency: string;
    allocations: Array<{ variantId: string; warehouseId: string; quantity: number }>;
    cartItems: Array<{ id: string; productVariantId: string }>;
    shippingFee: number;
  }) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const order = await this.createOrder(tx, {
          userId: params.userId,
          sessionId: params.userId ? null : params.sessionId,
          dto: params.dto,
          orderItemsData: params.orderItemsData,
          subTotal: params.totals.subtotal,
          totalAmount: params.totals.total,
          status: OrderStatusEnum.PENDING_PAYMENT,
          paymentDeadline: params.paymentDeadline,
          idempotencyKey: params.idempotencyKey,
          exchangeRate: params.exchangeRate,
          displayCurrency: params.displayCurrency,
          shippingFee: params.shippingFee,
        });

        await this.inventoryService.reserve(
          order.id,
          params.allocations.map((a) => ({
            ...a,
            cartItemId: params.cartItems.find((i) => i.productVariantId === a.variantId)?.id,
          })),
          params.paymentDeadline,
          tx,
          params.userId,
          params.sessionId,
        );

        const payment = await this.createPaymentTransaction(tx, {
          orderId: order.id,
          amount: params.totals.total,
          provider: params.dto.paymentMethod,
          status: 'pending',
        });

        await tx.orderTimeline.create({
          data: {
            orderId: order.id,
            action: 'ORDER_INITIATED',
            description: `Order created with payment method ${params.dto.paymentMethod}`,
            metadata: { idempotencyKey: params.idempotencyKey, version: 1 },
          },
        });

        return { order, payment };
      });
    } catch (error: any) {
      if (error?.code !== 'P2002') {
        throw error;
      }

      const existingOrder = await this.prisma.order.findUnique({
        where: { idempotencyKey: params.idempotencyKey },
        include: { transactions: true },
      });

      if (!existingOrder) {
        throw error;
      }

      this.logger.warn(`Recovered concurrent idempotent checkout for JTI ${params.idempotencyKey}`);

      return {
        order: existingOrder,
        payment: existingOrder.transactions[0] ?? null,
      };
    }
  }

  private async resolveExistingPaymentUrl(
    order: any,
    dto: CreateOrderWithPaymentDto,
  ): Promise<string | null> {
    if (
      order.paymentMethod === PaymentMethodEnum.VIETQR ||
      order.paymentMethod === PaymentMethodEnum.COD
    ) {
      return null;
    }

    return this.paymentService.generatePaymentUrl(
      order.id,
      order.code,
      Number(order.totalAmount),
      order.paymentMethod,
      dto.returnUrl,
      dto.cancelUrl,
    );
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

  private async cancelOrderAndReleaseInventory(orderId: string, reason?: string, actorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const [order] = await tx.$queryRaw<any[]>`
        SELECT *
        FROM "Order"
        WHERE "id" = ${orderId}::uuid
        FOR UPDATE
      `;
      if (!order) return null;
      if (order.status === OrderStatusEnum.CANCELLED) return order;

      if (
        order.status !== OrderStatusEnum.PENDING_PAYMENT &&
        order.status !== OrderStatusEnum.DRAFT
      ) {
        throw new ConflictException({
          code: 'ORDER_NOT_CANCELLABLE',
          message: `Cannot cancel order=${orderId} in status=${order.status}`,
        });
      }

      if (order.paymentStatus === PaymentStatusEnum.paid) {
        throw new ConflictException({
          code: 'ORDER_ALREADY_PAID',
          message: `Cannot release inventory for paid order=${orderId}`,
        });
      }

      await this.inventoryService.release(orderId, tx);

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatusEnum.CANCELLED,
          cancelReason: reason || 'Payment failed',
          cancelledAt: new Date(),
          version: { increment: 1 },
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId,
          action: 'ORDER_CANCELLED',
          description: reason || 'Order cancelled by system flow',
          actorId,
          actorType: actorId ? 'admin' : 'system',
          metadata: { version: updatedOrder.version },
        },
      });

      await tx.paymentTransaction.updateMany({
        where: { orderId, status: TransactionStatusEnum.pending },
        data: { status: TransactionStatusEnum.failed },
      });

      return updatedOrder;
    });
  }

  private buildOrderPaymentResponse(
    order: any,
    payment: any,
    paymentUrl: string | null,
    isVietQR: boolean,
    orderAccessToken?: string,
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
      orderAccessToken,
    };
  }

  async adminCreateOrder(dto: AdminCreateOrderDto, actorId?: string) {
    return SystemContextStore.asInternal('OrderPaymentService', async () => {
      this.logger.log(`Admin creating order for customer=${dto.customerId || dto.customerEmail}`);

      // Allocate inventory
      const allocations = await this.inventoryAllocator.allocate(
        dto.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      );

      // Retrieve product variants for details
      const variantIds = dto.items.map((item) => item.variantId);
      const variants = await this.prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
      });

      // Calculate order totals
      const subTotal = dto.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
      const shippingFee = await this.getShippingFeeVnd();
      const paymentTimeoutMinutes = await this.getPaymentTimeoutMinutes();
      const totalAmount = subTotal + shippingFee;
      const orderCode = this.generateOrderCode();
      const paymentDeadline = new Date(Date.now() + paymentTimeoutMinutes * 60 * 1000);

      // Create order and reserve stock atomically
      const order = await this.prisma.$transaction(async (tx) => {
        const hardenedTx = tx as HardenedTx;
        const createdOrder = await hardenedTx.order.create({
          data: {
            code: orderCode,
            user: dto.customerId ? { connect: { id: dto.customerId } } : undefined,
            guestEmail: dto.customerEmail,
            status: OrderStatusEnum.PENDING_PAYMENT,
            paymentStatus: 'unpaid',
            paymentMethod: 'VIETQR',
            paymentDeadline,
            shippingAddress: {
              fullName: dto.shippingName,
              phone: dto.shippingPhone,
              addressDetail: dto.shippingAddress.detail,
              wardName: dto.shippingAddress.ward,
              districtName: dto.shippingAddress.district,
              provinceName: dto.shippingAddress.city,
            } as any,
            billingAddress: {
              fullName: dto.shippingName,
              phone: dto.shippingPhone,
              addressDetail: dto.shippingAddress.detail,
              wardName: dto.shippingAddress.ward,
              districtName: dto.shippingAddress.district,
              provinceName: dto.shippingAddress.city,
            } as any,
            currency: 'VND',
            subTotal,
            shippingFee,
            totalAmount,
            note: dto.note,
            exchangeRate: 1,
            displayCurrency: 'VND',
            version: 1,
            items: {
              create: dto.items.map((item) => {
                const variant = variants.find((v) => v.id === item.variantId);
                return {
                  productVariantId: item.variantId,
                  productName:
                    typeof variant?.product?.name === 'string'
                      ? variant.product.name
                      : (variant?.product?.name as any)?.vi ||
                        (variant?.product?.name as any)?.en ||
                        'Product',
                  sku: variant?.sku || '',
                  variantTitle: variant?.variantTitle || {},
                  quantity: item.quantity,
                  price: item.price,
                  totalLine: item.price * item.quantity,
                };
              }),
            },
          },
          include: { items: true },
        });

        // Reserve inventory stock
        await this.inventoryService.reserve(
          createdOrder.id,
          allocations,
          paymentDeadline,
          tx,
          dto.customerId,
        );

        // Create audit trail entry
        await tx.orderTimeline.create({
          data: {
            orderId: createdOrder.id,
            action: 'ADMIN_ORDER_CREATED',
            description: `Order created by Admin ${actorId || ''}`,
            actorId,
            actorType: 'admin',
          },
        });

        return createdOrder;
      });

      // Send order confirmation email
      const recipientEmail =
        dto.customerEmail ||
        (dto.customerId
          ? (
              await this.prisma.user.findUnique({
                where: { id: dto.customerId },
                select: { email: true },
              })
            )?.email
          : null);

      if (recipientEmail) {
        try {
          await this.mailService.sendAdminOrderConfirmation(recipientEmail, order, dto);
        } catch (mailError) {
          this.logger.error(
            `Failed to send order confirmation email to ${recipientEmail}`,
            mailError,
          );
          // We intentionally swallow the error here so the order creation API succeeds
        }
      }

      return order;
    });
  }

  private generateOrderCode() {
    return `${this.ORDER_CODE_PREFIX}-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }

  private getPaymentTimeoutMinutes() {
    return this.settings.getNumber('order.paymentTimeoutMinutes');
  }

  private getShippingFeeVnd() {
    return this.settings.getNumber('order.shippingFeeVnd');
  }

  private generateTransactionCode() {
    return `TXN-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }
}
