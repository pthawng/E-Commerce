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
import { PriceEngineService } from './price-engine.service';
import { CheckoutValidator } from './checkout-validator.service';
import { AdminCreateOrderDto } from '../dto/admin-create-order.dto';



/**
 * Staff+ (L8) Internal Type Extension
 * Bracketing the Prisma type lag with strict shadow interfaces.
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
   * Step 2: Create order with payment integration
   */
  async createOrderWithPayment(
    dto: CreateOrderWithPaymentDto,
    userId?: string,
    sessionId?: string,
  ): Promise<OrderPaymentResponseDto> {
    return SystemContextStore.asInternal('OrderPaymentService', async () => {
      this.logger.log(`Creating order: method=${dto.paymentMethod}, userId=${userId}`);

      // 1. Authoritative Guest & Token Ownership Checks
      await this.checkoutValidator.validateGuest(dto.guestEmail, dto.guestVerifyToken);

      const tokenPayload = await this.checkoutTokenService.verifyToken(dto.checkoutToken);
      this.checkoutValidator.validateTokenOwnership(tokenPayload, userId, sessionId);

      const idempotencyKey = tokenPayload.jti;

      // 2. Global Idempotency Check using authoritative JTI
      const existingOrder = await this.prisma.order.findUnique({
        where: { idempotencyKey },
        include: { transactions: true },
      });
      if (existingOrder) {
        this.logger.warn(`Idempotent request for JTI ${idempotencyKey}: returning existing order`);
        return this.buildOrderPaymentResponse(existingOrder, existingOrder.transactions[0], null, false);
      }

      // 3. Fetch current state and cross-verify with token snapshot
      const { cart, variants } = await this.getCartAndVariants(userId, sessionId);
      if (!cart || cart.items.length === 0) throw new BadRequestException('Cart is empty');

      this.checkoutValidator.validateCartStability(cart.items, tokenPayload.cartHash);

      const { orderItemsData, totals } = this.calculateOrderTotals(
        cart.items,
        variants,
        dto.shippingMethodId,
      );

      this.checkoutValidator.validatePriceStability(
        totals.total,
        tokenPayload.totalAmount,
        orderItemsData,
        tokenPayload.lineItems,
      );


      // 4. Atomic Execution (Saga Step 1: Record Intent & Reserve)
      const paymentDeadline = new Date(Date.now() + this.PAYMENT_TIMEOUT_MINUTES * 60 * 1000);
      const targetCurrency = dto.paymentMethod === PaymentMethodEnum.PAYPAL ? 'USD' : 'VND';
      const exchangeRate = await this.currencyService.getRate(targetCurrency);

      const allocations = await this.inventoryAllocator.allocate(
        cart.items.map((item) => ({ variantId: item.productVariantId, quantity: item.quantity })),
      );

      const result = await this.prisma.$transaction(async (tx) => {
        const order = await this.createOrder(tx, {
          userId,
          sessionId: userId ? null : sessionId,
          dto,
          orderItemsData,
          subTotal: totals.subtotal,
          totalAmount: totals.total,
          status: OrderStatusEnum.PENDING_PAYMENT,
          paymentDeadline,
          idempotencyKey,
          exchangeRate,
          displayCurrency: targetCurrency,
        });

        await this.inventoryService.reserve(
          order.id,
          allocations.map((a) => ({
            ...a,
            cartItemId: cart.items.find((i) => i.productVariantId === a.variantId)?.id,
          })),
          paymentDeadline,
          tx,
          userId,
          sessionId,
        );

        const payment = await this.createPaymentTransaction(tx, {
          orderId: order.id,
          amount: totals.total,
          provider: dto.paymentMethod,
          status: 'pending',
        });

        await tx.orderTimeline.create({
          data: {
            orderId: order.id,
            action: 'ORDER_INITIATED',
            description: `Order created with payment method ${dto.paymentMethod}`,
            metadata: { idempotencyKey, version: 1 },
          },
        });

        return { order, payment };
      });

      // 5. External Interaction (Saga Step 2: Payment Gateway Integration)
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
          // ⚠️ Saga Compensation: If external gateway fails, we MUST revert the DB transaction state
          await this.cancelOrderAndReleaseInventory(result.order.id, 'Payment gateway unreachable');
          throw new BadRequestException('Payment system currently unavailable. Order cancelled.');
        }
      }

      // 6. Completion (Saga Step 3: Access Control & Response)
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
        // 1. Pessimistic Lock (L8 Production Standard)
        // We lock the Order record to prevent race conditions between callback and syncStatus.
        const orders = await currentTx.$queryRawUnsafe<any[]>(
          `SELECT * FROM "Order" WHERE "id" = $1 FOR UPDATE`,
          orderId,
        );
        const order = orders[0];

        if (!order) {
          this.logger.warn(`Order ${orderId} not found during confirmation attempt.`);
          return;
        }

        // 2. Idempotency Gate (Post-lock)
        if (order.status === OrderStatusEnum.CONFIRMED) {
          this.logger.log(`Order ${orderId} already confirmed. Skipping.`);
          return;
        }

        // 3. Status Transition Validation
        // OrderStatusValidator.validate(orderId, order.status, OrderStatusEnum.CONFIRMED);

        // 4. Atomic Side Effects
        // Deduction (Reserve -> Confirm)
        await this.inventoryService.deduct(orderId, currentTx);

        // Update Order Status and Version
        const updatedOrder = await currentTx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatusEnum.CONFIRMED,
            paymentStatus: 'paid',
            confirmedAt: new Date(),
            version: { increment: 1 },
          },
        });

        // Audit Trail with Sequence Version
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

        // Reliable Notification (Transactional Outbox)
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

        // Clear Cart
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
    const itemsForEngine = items.map((item) => {
      const variant = variants.find((v) => v.id === item.productVariantId);
      return { price: Number(variant.price), quantity: item.quantity };
    });

    const totals = this.priceEngine.calculateTotals({
      items: itemsForEngine,
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
      shippingFee: this.SHIPPING_FEE,
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
        shippingFee: this.SHIPPING_FEE,
        totalAmount: params.totalAmount,
        note: params.dto.note,
        idempotencyKey: params.dto.idempotencyKey,
        exchangeRate: params.exchangeRate,
        displayCurrency: params.displayCurrency,
        version: 1,
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
      if (!order || order.status === OrderStatusEnum.CANCELLED) return;

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
          metadata: { version: updatedOrder.version },
        },
      });

      await tx.paymentTransaction.updateMany({
        where: { orderId },
        data: { status: 'failed' },
      });
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

      // 1. Allocate inventory
      const allocations = await this.inventoryAllocator.allocate(
        dto.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      );

      // 2. Fetch variants for mapping
      const variantIds = dto.items.map((item) => item.variantId);
      const variants = await this.prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
      });

      // 3. Calculate totals
      const subTotal = dto.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
      const totalAmount = subTotal + this.SHIPPING_FEE;
      const orderCode = this.generateOrderCode();
      const paymentDeadline = new Date(Date.now() + this.PAYMENT_TIMEOUT_MINUTES * 60 * 1000);

      // 4. Save order & reserve stock atomically
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
            shippingFee: this.SHIPPING_FEE,
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
                  productName: typeof variant?.product?.name === 'string'
                    ? variant.product.name
                    : (variant?.product?.name as any)?.vi || (variant?.product?.name as any)?.en || 'Sản phẩm',
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

        // 5. Reserve stock
        await this.inventoryService.reserve(
          createdOrder.id,
          allocations,
          paymentDeadline,
          tx,
          dto.customerId,
        );

        // 6. Audit Trail
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

      // 7. Send Confirmation Email
      const recipientEmail = dto.customerEmail || 
        (dto.customerId ? (await this.prisma.user.findUnique({ where: { id: dto.customerId }, select: { email: true } }))?.email : null);

      if (recipientEmail) {
        try {
          await this.mailService.sendAdminOrderConfirmation(recipientEmail, order, dto);
        } catch (mailError) {
          this.logger.error(`Failed to send order confirmation email to ${recipientEmail}`, mailError);
          // We intentionally swallow the error here so the order creation API succeeds
        }
      }

      return order;
    });
  }

  private generateOrderCode() {
    return `${this.ORDER_CODE_PREFIX}-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }
  private generateTransactionCode() {
    return `TXN-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }
}
