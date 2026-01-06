import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { CartService } from '../cart/cart.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

// Generate Order Code (e.g., #ORD-170123-XXXX)
function generateOrderCode() {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${date}-${random}`;
}

@Injectable()
export class OrderService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cartService: CartService, // Reuse logic if needed, but prefer raw query for transaction
    ) { }

    // ============================================
    // 1. CREATE ORDER (CHECKOUT)
    // ============================================
    async createOrder(userId: string | undefined, sessionId: string | undefined, dto: CreateOrderDto) {
        if (!userId && !sessionId) throw new BadRequestException('User or Session required');

        // 1. Get Cart Logic (Raw)
        const cartWhere = userId ? { userId } : { sessionId };
        const cart = await this.prisma.cart.findFirst({
            where: cartWhere,
            include: { items: true }
        });

        if (!cart || cart.items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        // 2. Validate Price Snapshot & Stock (Pre-check)
        const variantIds = cart.items.map(i => i.productVariantId);
        const variants = await this.prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            include: { inventoryItems: true, product: true }
        });

        const priceMismatches: any[] = [];

        for (const item of cart.items) {
            const variant = variants.find(v => v.id === item.productVariantId);
            if (!variant) throw new BadRequestException(`Product in cart no longer exists`);

            // Check Active
            if (!variant.isActive || !variant.product.isActive) {
                throw new BadRequestException(`Product ${variant.sku} is inactive`);
            }

            // Check Price Change
            // Compare Decimal: convert to Number or use generic compare
            if (Number(variant.price) !== Number(item.cachedPrice)) {
                priceMismatches.push({
                    variantId: variant.id,
                    sku: variant.sku,
                    oldPrice: item.cachedPrice,
                    newPrice: variant.price
                });
            }

            // Check Stock
            const totalStock = variant.inventoryItems.reduce((acc, inv) => acc + inv.quantity - inv.reservedQuantity, 0);
            if (totalStock < item.quantity) {
                throw new BadRequestException(`Insufficient stock for product ${variant.sku} (Remaining: ${totalStock})`);
            }
        }

        // 3. Handle Price Mismatch
        // Logic: Nếu có chênh lệch VÀ user chưa confirm -> Throw Conflict
        // Nếu user confirm = true -> Bỏ qua check, chấp nhận giá MỚI NHẤT (hay giá cũ?)
        // Yêu cầu của bạn: "Lưu giá tại thời điểm thêm vào giỏ... Hiển thị thông báo... dùng giá đã lưu"
        // -> Nếu user confirm, tức là chấp nhận SỰ THAY ĐỔI -> Cần update lại giá CŨ thành giá MỚI?
        // Hoặc chấp nhận thanh toán với GIÁ CŨ? 
        // Thường thì Platform sẽ không cho thanh toán giá sai. Bắt buộc user phải refresh cart.

        if (priceMismatches.length > 0) {
            // Option A: Bắt user refresh cart
            if (!dto.confirmPriceChange) {
                throw new ConflictException({
                    message: 'Giá sản phẩm đã thay đổi. Vui lòng cập nhật giỏ hàng.',
                    code: 'PRICE_CHANGED',
                    details: priceMismatches
                });
            }
            // Nếu confirmPriceChange = true -> Chúng ta cần update lại cachedPrice trong cartItem cho đúng dbPrice
            // để record vào Order đúng giá thực tế hệ thống.
            // Update logic ở dưới transaction.
        }

        // 4. TRANSACTION: Create Order
        return this.prisma.$transaction(async (tx) => {
            // A. Cập nhật lại giá nếu confirm (nếu cần thiết để data consistency)
            // Hoặc đơn giản là dùng giá MỚI nhất từ DB Variants để tạo order
            // Ở đây tôi sẽ dùng giá hiện tại của Variants để tạo Order Item (Source of Truth)

            // Calculate Totals
            let subTotal = 0;
            const orderItemsData = cart.items.map(item => {
                const variant = variants.find(v => v.id === item.productVariantId)!;
                const priceToUse = variant.price; // Always use real price at checkout (after validation passed)
                const lineTotal = Number(priceToUse) * item.quantity;
                subTotal += lineTotal;

                return {
                    productVariantId: variant.id,
                    productName: (variant.product.name as any)?.vi || (variant.product.name as any)?.en || 'Product', // Safe cast
                    sku: variant.sku,
                    variantTitle: variant.variantTitle ?? {},
                    thumbnailUrl: variant.thumbnailUrl,
                    quantity: item.quantity,
                    price: priceToUse,
                    totalLine: lineTotal
                };
            });

            // B. Shipping Fee (Mock logic)
            const shippingFee = 30000;
            const totalAmount = subTotal + shippingFee;

            // C. Create Order
            const order = await tx.order.create({
                data: {
                    code: generateOrderCode(),
                    userId: userId || null, // Guest order link to user null? 
                    // Note: Guest checkout usually needs guestEmail. 
                    // DTO has guestEmail, where to store? User table? Or Order field?
                    // Order schema lacks guestEmail field -> Temporarily ignore or store in shippingAddress JSON.
                    status: 'pending',
                    paymentStatus: 'unpaid',
                    shippingAddress: dto.shippingAddress as unknown as Prisma.InputJsonValue,
                    billingAddress: (dto.billingAddress ?? dto.shippingAddress) as unknown as Prisma.InputJsonValue,
                    subTotal: subTotal,
                    shippingFee: shippingFee,
                    totalAmount: totalAmount,
                    items: {
                        create: orderItemsData
                    },
                    transactions: {
                        create: {
                            amount: totalAmount,
                            type: 'payment',
                            status: 'pending',
                            provider: dto.paymentMethod, // 'VNPAY', 'COD'
                            method: dto.paymentMethod
                        }
                    }
                }
            });

            // D. Update Inventory (Stock Deduction)
            for (const item of cart.items) {
                // Select warehouse to deduct (Complex logic: Warehouse selection). 
                // Simplification: Deduct from first available warehouse.
                const variant = variants.find(v => v.id === item.productVariantId)!;
                let remainingToDeduct = item.quantity;

                for (const inv of variant.inventoryItems) {
                    if (remainingToDeduct <= 0) break;
                    const available = inv.quantity - inv.reservedQuantity;
                    if (available > 0) {
                        const deduct = Math.min(available, remainingToDeduct);
                        await tx.inventoryItem.update({
                            where: { id: inv.id },
                            data: { quantity: { decrement: deduct } }
                        });

                        // Log Inventory
                        await tx.inventoryLog.create({
                            data: {
                                inventoryItemId: inv.id,
                                actionType: 'SALE',
                                quantityChange: -deduct,
                                stockAfter: inv.quantity - deduct,
                                referenceId: order.id,
                                referenceCode: order.code,
                                note: 'Order Checkout'
                            }
                        });

                        remainingToDeduct -= deduct;
                    }
                }

                if (remainingToDeduct > 0) {
                    throw new Error(`Inventory sync error. Insufficient stock for ${variant.sku}`);
                }
            }

            // E. Clear Cart (Hard Delete or Soft Delete)
            await tx.cart.delete({ where: { id: cart.id } });

            return order;
        });
    }

    // ============================================
    // GET ORDERS
    // ============================================
    async getMyOrders(userId: string) {
        return this.prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { items: true }
        });
    }

    async getOrder(id: string, userId?: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { items: true, transactions: true, shippingMethod: true }
        });

        if (!order) throw new NotFoundException('Order not found');
        // Security check: If User -> check userId. If Guest -> no check?
        // Strict: If userId exists, must match.
        if (userId && order.userId && order.userId !== userId) {
            throw new NotFoundException('Order not found');
        }
        return order;
    }
}
