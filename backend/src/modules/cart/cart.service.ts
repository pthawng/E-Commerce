import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  constructor(
    private readonly prisma: PrismaService,
    @InjectMetric('cart_concurrency_conflicts_total')
    private readonly conflictCounter: Counter<string>,
    @InjectMetric('cart_operation_duration_seconds')
    private readonly durationHistogram: Histogram<string>,
  ) {}

  private readonly CART_TTL_DAYS = 30;
  private readonly IDEMPOTENCY_TTL_HOURS = 24;
  private readonly SHIPPING_THRESHOLD = 2000000;
  private readonly SHIPPING_FEE = 35000;

  // Helper to extract string from Json localized name
  private getLocalizedName(name: any): string {
    if (!name) return '';
    if (typeof name === 'string') return name;
    return name.vi || name.en || Object.values(name)[0] || 'Unnamed Product';
  }

  private computeCartExpiresAt(now = new Date()) {
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + this.CART_TTL_DAYS);
    return expiresAt;
  }

  private computeIdempotencyExpiresAt(now = new Date()) {
    return new Date(now.getTime() + this.IDEMPOTENCY_TTL_HOURS * 60 * 60 * 1000);
  }

  private async lockCartRow(tx: any, cartId: string) {
    // Row-level lock (Postgres). Uses mapped table name "carts".
    await tx.$executeRaw`SELECT 1 FROM "carts" WHERE "id" = ${cartId}::uuid FOR UPDATE`;
  }

  // ============================================
  // 1. GET CART
  // ============================================
  async getCart(userId?: string, sessionId?: string) {
    const timer = this.durationHistogram.startTimer({ operation: 'get' });
    try {
      const cart = await this.findCartRaw(this.prisma, userId, sessionId);
      if (!cart) return this.emptyCartResponse();

      return this.getCartInternal(userId, sessionId, this.prisma, cart.id);
    } catch (error) {
      this.logger.error(
        `getCart failed for userId=${userId}, sessionId=${sessionId}`,
        error?.stack || error,
      );
      throw error;
    } finally {
      timer();
    }
  }

  private emptyCartResponse(id?: string, version = 1, warnings: any[] = []) {
    return {
      id,
      items: [],
      version,
      warnings,
      totals: {
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0,
        isFreeShipping: false,
        shippingThreshold: this.SHIPPING_THRESHOLD,
      },
    };
  }

  getCartConfig() {
    return {
      shippingThreshold: this.SHIPPING_THRESHOLD,
      shippingFee: this.SHIPPING_FEE,
      currency: 'VND',
      maxQuantityPerItem: 99,
    };
  }

  // ============================================
  // 2. ADD TO CART (Atomic, Idempotent & Deep Lock)
  // ============================================
  async addToCart(userId: string | undefined, sessionId: string | undefined, dto: AddToCartDto) {
    const timer = this.durationHistogram.startTimer({ operation: 'add' });
    const requestStartedAt = new Date();
    try {
      if (!userId && !sessionId) throw new BadRequestException('Missing User/Session info');

      // Persistent idempotency gate MUST be outside the cart transaction.
      // Otherwise rollback would erase the "in-progress" lock and allow duplicate concurrent work.
      if (dto.idempotencyKey) {
        const existing = await this.prisma.idempotencyRecord.findUnique({
          where: { idempotencyKey: dto.idempotencyKey },
        });

        if (existing?.responseBody) return existing.responseBody;
        if (existing && !existing.responseBody) {
          throw new ConflictException('Duplicate request in progress (idempotency key locked).');
        }

        try {
          await this.prisma.idempotencyRecord.create({
            data: {
              idempotencyKey: dto.idempotencyKey,
              expiresAt: this.computeIdempotencyExpiresAt(requestStartedAt),
            },
          });
        } catch (e: any) {
          // Another request won the race to create the record.
          const raced = await this.prisma.idempotencyRecord.findUnique({
            where: { idempotencyKey: dto.idempotencyKey },
          });
          if (raced?.responseBody) return raced.responseBody;
          throw new ConflictException('Duplicate request in progress (idempotency key locked).');
        }
      }

      const variant = await this.prisma.productVariant.findUnique({
        where: { id: dto.variantId },
        include: {
          product: { select: { isActive: true } },
          inventoryItems: true,
        },
      });

      if (!variant) throw new NotFoundException('Product not found');
      if (!variant.isActive || !variant.product?.isActive) {
        throw new BadRequestException('Product is currently unavailable');
      }

      const availableStock = variant.inventoryItems.reduce(
        (acc, inv) => acc + inv.quantity - inv.reservedQuantity,
        0,
      );
      if (availableStock <= 0) throw new BadRequestException('Product is out of stock');
      if (availableStock < dto.quantity) {
        throw new BadRequestException('Insufficient stock');
      }

      const result = await this.prisma.$transaction(
        async (tx) => {
          const now = new Date();

          // A. Atomically Get/Create Cart
          let cart = await this.findCartRaw(tx, userId, sessionId);
          if (!cart) {
            cart = await tx.cart.create({
              data: {
                userId: userId || undefined,
                sessionId: userId ? undefined : sessionId,
                version: 1,
                expiresAt: this.computeCartExpiresAt(now),
              },
            });
          }

          // B. Row-Level Locking (Pessimistic) BEFORE any mutation/version bump
          await this.lockCartRow(tx, cart.id);

          // C. Strict optimistic version check (only if version provided)
          if (dto.version !== undefined && cart.version !== dto.version) {
            throw new ConflictException('Cart version mismatch. Concurrent update detected.');
          }

          // D. Atomic Item Upsert
          const item = await tx.cartItem.upsert({
            where: {
              cartId_productVariantId: { cartId: cart.id, productVariantId: dto.variantId },
            },
            update: {
              quantity: { increment: dto.quantity },
              cachedPrice: variant.price,
              addedAt: new Date(),
            },
            create: {
              cartId: cart.id,
              productVariantId: dto.variantId,
              quantity: dto.quantity,
              cachedPrice: variant.price,
              currency: 'VND', // Default for now
            },
          });

          if (item.quantity > 99) {
            await tx.cartItem.update({ where: { id: item.id }, data: { quantity: 99 } });
          }

          // E. Update cart metadata (version bump + TTL) after successful mutation
          const updatedCart = await tx.cart.update({
            where: { id: cart.id },
            data: {
              updatedAt: now,
              expiresAt: this.computeCartExpiresAt(now),
              version: { increment: 1 },
            },
          });

          const finalCart = await this.getCartInternal(userId, sessionId, tx, updatedCart.id);

          // F. Seal idempotency record
          if (dto.idempotencyKey) {
            await tx.idempotencyRecord.update({
              where: { idempotencyKey: dto.idempotencyKey },
              data: {
                responseBody: finalCart as any,
                statusCode: 200,
                expiresAt: this.computeIdempotencyExpiresAt(now),
              },
            });
          }

          return finalCart;
        },
        { isolationLevel: 'Serializable' },
      );

      return result;
    } catch (error) {
      if (error instanceof ConflictException) this.conflictCounter.inc();
      this.logger.error(
        `addToCart failed for userId=${userId}, sessionId=${sessionId}`,
        error?.stack || error,
      );

      // Best-effort seal for auditability (do not block original error).
      if (dto.idempotencyKey) {
        try {
          await this.prisma.idempotencyRecord.update({
            where: { idempotencyKey: dto.idempotencyKey },
            data: {
              statusCode: error instanceof ConflictException ? 409 : 500,
              expiresAt: this.computeIdempotencyExpiresAt(requestStartedAt),
            },
          });
        } catch {
          // ignore
        }
      }
      throw error;
    } finally {
      timer();
    }
  }

  // ============================================
  // 3. UPDATE ITEM (Hybrid Locking)
  // ============================================
  async updateItem(
    userId: string | undefined,
    sessionId: string | undefined,
    variantId: string,
    dto: UpdateCartItemDto,
  ) {
    const timer = this.durationHistogram.startTimer({ operation: 'update' });
    try {
      if (dto.quantity <= 0) return this.removeItem(userId, sessionId, variantId, dto.version);

      const cart = await this.findCartRaw(this.prisma, userId, sessionId);
      if (!cart) throw new NotFoundException('Cart not found');

      const variant = await this.prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { inventoryItems: true },
      });
      if (!variant) throw new NotFoundException('Variant not found');

      const availableStock = variant.inventoryItems.reduce(
        (acc, inv) => acc + inv.quantity - inv.reservedQuantity,
        0,
      );
      const finalQty = Math.min(dto.quantity, availableStock, 99);

      return await this.prisma.$transaction(async (tx) => {
        const now = new Date();
        // 1) Lock cart row first
        await this.lockCartRow(tx, cart.id);

        // 2) Strict version check
        if (dto.version !== undefined) {
          const current = await tx.cart.findUnique({ where: { id: cart.id } });
          if (!current || current.version !== dto.version) {
            this.conflictCounter.inc();
            throw new ConflictException('Cart version mismatch. Concurrent update detected.');
          }
        }

        await tx.cartItem.update({
          where: { cartId_productVariantId: { cartId: cart.id, productVariantId: variantId } },
          data: { quantity: finalQty },
        });

        await tx.cart.update({
          where: { id: cart.id },
          data: {
            version: { increment: 1 },
            updatedAt: now,
            expiresAt: this.computeCartExpiresAt(now),
          },
        });

        return this.getCartInternal(userId, sessionId, tx, cart.id);
      });
    } catch (error) {
      this.logger.error(
        `updateItem failed for userId=${userId}, sessionId=${sessionId}`,
        error?.stack || error,
      );
      throw error;
    } finally {
      timer();
    }
  }

  // ============================================
  // 4. REMOVE ITEM
  // ============================================
  async removeItem(
    userId: string | undefined,
    sessionId: string | undefined,
    variantId: string,
    version?: number,
  ) {
    const timer = this.durationHistogram.startTimer({ operation: 'remove' });
    try {
      const cart = await this.findCartRaw(this.prisma, userId, sessionId);
      if (!cart) return this.emptyCartResponse();

      return await this.prisma.$transaction(async (tx) => {
        const now = new Date();
        await this.lockCartRow(tx, cart.id);

        if (version !== undefined) {
          const current = await tx.cart.findUnique({ where: { id: cart.id } });
          if (!current || current.version !== version) {
            this.conflictCounter.inc();
            throw new ConflictException('Cart version mismatch.');
          }
        }

        await tx.cartItem.deleteMany({
          where: { cartId: cart.id, productVariantId: variantId },
        });

        await tx.cart.update({
          where: { id: cart.id },
          data: {
            version: { increment: 1 },
            updatedAt: now,
            expiresAt: this.computeCartExpiresAt(now),
          },
        });

        return this.getCartInternal(userId, sessionId, tx, cart.id);
      });
    } catch (error) {
      this.logger.error(
        `removeItem failed for userId=${userId}, sessionId=${sessionId}`,
        error?.stack || error,
      );
      throw error;
    } finally {
      timer();
    }
  }

  // ============================================
  // 5. MERGE CART (sum quantities for matching variants)
  // ============================================
  async mergeCart(userId: string, sessionId: string) {
    const timer = this.durationHistogram.startTimer({ operation: 'merge' });
    try {
      return await this.prisma.$transaction(async (tx) => {
        const now = new Date();
        const guestCart = await tx.cart.findFirst({ where: { sessionId } });
        const warnings: any[] = [];

        if (!guestCart) return this.getCartInternal(userId, undefined, tx);

        // Lock both carts if they exist
        await this.lockCartRow(tx, guestCart.id);

        let userCart = await tx.cart.findFirst({
          where: { userId, sessionId: null },
        });

        if (!userCart) {
          userCart = await tx.cart.create({
            data: { userId, version: 1, expiresAt: this.computeCartExpiresAt(now) },
          });
        } else {
          userCart = await tx.cart.update({
            where: { id: userCart.id },
            data: { updatedAt: now },
          });
        }

        await this.lockCartRow(tx, userCart.id);

        const guestItems = await tx.cartItem.findMany({
          where: { cartId: guestCart.id },
          include: { productVariant: { include: { inventoryItems: true } } },
        });

        for (const gItem of guestItems) {
          const availableStock = (gItem.productVariant.inventoryItems || []).reduce(
            (acc, inv) => acc + (inv.quantity || 0) - (inv.reservedQuantity || 0),
            0,
          );

          if (availableStock <= 0) {
            warnings.push({
              type: 'OUT_OF_STOCK',
              productId: gItem.productVariant.productId,
              variantId: gItem.productVariantId,
            });
            continue;
          }

          if (availableStock < gItem.quantity) {
            warnings.push({
              type: 'QUANTITY_REDUCED',
              productId: gItem.productVariant.productId,
              variantId: gItem.productVariantId,
              from: gItem.quantity,
              to: availableStock,
            });
          }

          const finalQuantity = Math.min(gItem.quantity, availableStock);

          await tx.cartItem.upsert({
            where: {
              cartId_productVariantId: {
                cartId: userCart.id,
                productVariantId: gItem.productVariantId,
              },
            },
            update: { quantity: { increment: finalQuantity } },
            create: {
              cartId: userCart.id,
              productVariantId: gItem.productVariantId,
              quantity: finalQuantity,
              cachedPrice: gItem.cachedPrice,
              currency: gItem.currency,
              taxRate: gItem.taxRate,
              discountSnapshot: gItem.discountSnapshot as any,
            },
          });
        }

        await tx.cartItem.deleteMany({ where: { cartId: guestCart.id } });
        await tx.cart.delete({ where: { id: guestCart.id } });

        await tx.cart.update({
          where: { id: userCart.id },
          data: {
            version: { increment: 1 },
            updatedAt: now,
            expiresAt: this.computeCartExpiresAt(now),
          },
        });

        return this.getCartInternal(userId, undefined, tx, userCart.id, warnings);
      });
    } catch (error) {
      this.logger.error(
        `mergeCart failed for userId=${userId}, sessionId=${sessionId}`,
        error?.stack || error,
      );
      throw error;
    } finally {
      timer();
    }
  }

  // ============================================
  // 6. REFRESH PRICES
  // ============================================
  async refreshCartPrices(userId?: string, sessionId?: string) {
    const timer = this.durationHistogram.startTimer({ operation: 'refresh' });
    try {
      const rawCart = await this.findCartRaw(this.prisma, userId, sessionId);
      if (!rawCart) return this.emptyCartResponse();

      const items = await this.prisma.cartItem.findMany({ where: { cartId: rawCart.id } });
      if (items.length === 0) return this.getCart(userId, sessionId);

      const variantIds = items.map((i) => i.productVariantId);
      const variants = await this.prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, price: true },
      });

      await this.prisma.$transaction(async (tx) => {
        const now = new Date();
        await this.lockCartRow(tx, rawCart.id);

        for (const item of items) {
          const variant = variants.find((v) => v.id === item.productVariantId);
          if (variant && Number(variant.price) !== Number(item.cachedPrice)) {
            await tx.cartItem.update({
              where: { id: item.id },
              data: { cachedPrice: variant.price },
            });
          }
        }
        await tx.cart.update({
          where: { id: rawCart.id },
          data: {
            updatedAt: now,
            version: { increment: 1 },
            expiresAt: this.computeCartExpiresAt(now),
          },
        });
      });

      return this.getCart(userId, sessionId);
    } finally {
      timer();
    }
  }

  private async getCartInternal(
    userId: string | undefined,
    sessionId: string | undefined,
    tx?: any,
    cartIdHint?: string,
    warnings: any[] = [],
  ) {
    const client = tx ?? this.prisma;
    const cart = cartIdHint
      ? await client.cart.findUnique({ where: { id: cartIdHint } })
      : await this.findCartRaw(client, userId, sessionId);

    if (!cart) return this.emptyCartResponse(undefined, 1, warnings);

    const items = await client.cartItem.findMany({
      where: { cartId: cart.id },
      orderBy: { addedAt: 'desc' },
    });

    if (items.length === 0) return this.emptyCartResponse(cart.id, cart.version, warnings);

    const variantIds = items.map((i: any) => i.productVariantId);
    const variants = await client.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: {
          include: {
            media: { where: { isThumbnail: true }, take: 1 },
          },
        },
        inventoryItems: { select: { quantity: true, reservedQuantity: true } },
        media: { where: { isThumbnail: true }, take: 1 },
        attributes: {
          include: {
            attributeValue: {
              include: {
                attribute: true,
              },
            },
          },
        },
      },
    });

    return this.mapCartResponse(cart, items, variants, warnings);
  }

  /**
   * Cart mapping strategy:
   * 1. Centralized mapper to ensure consistency across all cart operations (get/add/update/merge).
   * 2. Defensive Image Fallbacks: Variant Thumb > Variant Media > Product Media > Placeholder.
   * 3. Robust localized name handling.
   */
  private mapCartResponse(cart: any, items: any[], variants: any[], warnings: any[] = []) {
    let subtotal = 0;
    const mappedItems: any[] = [];

    for (const item of items) {
      const v = variants.find((vv: any) => vv.id === item.productVariantId);
      if (!v) continue;

      const currentPrice = v.price ? Number(v.price.toString()) : 0;
      const lineTotal = currentPrice * item.quantity;
      subtotal += lineTotal;

      const totalStock = (v.inventoryItems || []).reduce(
        (acc: number, inv: any) => acc + (inv.quantity || 0) - (inv.reservedQuantity || 0),
        0,
      );

      // Defensive Image Mapping Strategy
      const image =
        v.thumbnailUrl || v.media?.[0]?.url || v.product?.media?.[0]?.url || '/placeholder.svg';

      mappedItems.push({
        id: item.id,
        variantId: v.id,
        productId: v.productId,
        name: v.product?.name ?? { en: 'Unknown Product' },
        slug: v.product?.slug ?? '',
        price: currentPrice,
        quantity: item.quantity,
        currency: item.currency,
        taxRate: item.taxRate ? Number(item.taxRate.toString()) : 0,
        discountSnapshot: item.discountSnapshot,
        image: image,
        stock: totalStock,
        isAvailable: (v.isActive && v.product?.isActive && totalStock > 0) ?? false,
        attributes: (v.attributes || [])
          .filter((va: any) => va?.attributeValue?.attribute)
          .map((va: any) => ({
            name: this.getLocalizedName(va.attributeValue.attribute.name),
            value: this.getLocalizedName(va.attributeValue.value),
          })),
      });
    }

    const isFreeShipping = subtotal >= this.SHIPPING_THRESHOLD;
    const shipping = subtotal === 0 ? 0 : isFreeShipping ? 0 : this.SHIPPING_FEE;
    const tax = 0;
    const total = subtotal + shipping + tax;

    return {
      id: cart.id,
      version: cart.version,
      items: mappedItems,
      warnings,
      totals: {
        subtotal,
        shipping,
        tax,
        total,
        isFreeShipping,
        shippingThreshold: this.SHIPPING_THRESHOLD,
      },
    };
  }

  private async findCartRaw(client: any, userId?: string, sessionId?: string) {
    if (userId)
      return client.cart.findFirst({
        where: { userId, sessionId: null },
      });
    if (sessionId)
      return client.cart.findFirst({ where: { sessionId }, orderBy: { updatedAt: 'desc' } });
    return null;
  }
}
