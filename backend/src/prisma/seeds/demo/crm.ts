import {
  OrderStatusEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
  PrismaClient,
  UserType,
  LuxurySegment,
  ReconciliationStatus,
  TransactionStatusEnum,
  TransactionTypeEnum
} from '@prisma/client';
import * as argon2 from 'argon2';

const ARGON_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  timeCost: 2,
  memoryCost: 19456,
  parallelism: 1,
};

export async function seedCRM(prisma: PrismaClient) {
  console.log('🧹 Wiping old transactional data (Orders, Transactions, Timelines)...');
  await prisma.paymentTransaction.deleteMany({});
  await prisma.orderTimeline.deleteMany({});
  await prisma.order.deleteMany({});

  console.log('👥 Simulation Engine: Generating 1,000 Customers & 2,000 Linked Transactions...');

  const passwordHash = await argon2.hash('customer123', ARGON_OPTIONS);
  const firstNames = ['Minh', 'Anh', 'Lan', 'Tuấn', 'Hùng', 'Linh', 'Thảo', 'Dương', 'Sơn', 'Trang'];
  const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ'];
  const segments: LuxurySegment[] = ['PROSPECT', 'ACTIVE', 'LOYAL', 'VIP', 'VVIP', 'VIC'];

  const cities = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
  const districts = ['Quận 1', 'Quận 3', 'Quận Cầu Giấy', 'Quận Hoàn Kiếm', 'Quận Hai Bà Trưng'];
  const wards = ['Phường 1', 'Phường 2', 'Phường 3', 'Phường Tràng Tiền', 'Phường Bến Nghé'];

  // 1. Create Customers in Chunks
  const customerIds: string[] = [];
  const CHUNK_SIZE = 50;
  
  for (let i = 0; i < 1000; i += CHUNK_SIZE) {
    const chunkPromises = Array.from({ length: Math.min(CHUNK_SIZE, 1000 - i) }).map(async (_, idx) => {
      const globalIdx = i + idx;
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `customer${globalIdx + 1}@rayparadis.luxury`;
      
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          fullName: `${lastName} ${firstName} ${globalIdx + 1}`,
          passwordHash,
          userType: UserType.CUSTOMER,
          isActive: true,
          isEmailVerified: true,
          segment: segments[Math.floor(Math.random() * segments.length)],
          phone: `0987${Math.floor(1000000 + Math.random() * 9000000)}`,
        },
      });
      return user.id;
    });
    const ids = await Promise.all(chunkPromises);
    customerIds.push(...ids);
    if (customerIds.length % 200 === 0) console.log(`...Generated ${customerIds.length} customers`);
  }

  // 2. Fetch Resources
  const variants = await prisma.productVariant.findMany({ select: { id: true, price: true, sku: true, variantTitle: true } });
  const admin = await prisma.user.findFirst({ where: { userType: UserType.SUPER_ADMIN } });

  if (variants.length === 0) {
    console.error('❌ No product variants found. Run catalog seed first.');
    return;
  }

  const orderStatuses: OrderStatusEnum[] = [
    'PENDING_PAYMENT', 'CONFIRMED', 'MATERIAL_RESERVED', 'IN_PRODUCTION', 'QC', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'
  ];

  const activeWorkStatuses = [
    'CONFIRMED', 'MATERIAL_RESERVED', 'IN_PRODUCTION', 'QC', 'READY_TO_SHIP', 'SHIPPED'
  ];

  // 3. Create Orders in Chunks
  console.log('📦 Simulating 2,000 Order Lifecycles...');
  for (let i = 0; i < 2000; i += CHUNK_SIZE) {
    const chunkPromises = Array.from({ length: Math.min(CHUNK_SIZE, 2000 - i) }).map(async (_, idx) => {
      const globalIdx = i + idx;
      const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const isPaid = ['COMPLETED', 'DELIVERED', 'SHIPPED', 'READY_TO_SHIP', 'QC', 'IN_PRODUCTION', 'MATERIAL_RESERVED', 'CONFIRMED'].includes(status);
      const paymentStatus: PaymentStatusEnum = isPaid ? 'paid' : 'unpaid';
      
      const itemsCount = Math.floor(Math.random() * 2) + 1;
      const selectedVariants = Array.from({ length: itemsCount }).map(() => variants[Math.floor(Math.random() * variants.length)]);
      const subTotal = selectedVariants.reduce((sum, v) => sum + Number(v.price), 0);
      
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 120)); // Last 4 months
      const sessionId = `sim-session-${Math.floor(Math.random() * 5000)}`;

      // Use a transaction for each order to ensure atomic integrity
      return await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            code: `RP-${Math.floor(100000 + Math.random() * 899999)}-${globalIdx}`,
            userId: customerId,
            status,
            paymentStatus,
            totalAmount: subTotal,
            subTotal,
            currency: 'VND',
            createdAt,
            sessionId,
            paymentMethod: PaymentMethodEnum.PAYPAL,
            shippingAddress: {
              name: 'Customer Name',
              phone: '0987654321',
              city: cities[Math.floor(Math.random() * cities.length)],
              district: districts[Math.floor(Math.random() * districts.length)],
              ward: wards[Math.floor(Math.random() * wards.length)],
              detail: 'Luxury Boutique St',
            },
            items: {
              create: selectedVariants.map(v => ({
                productVariantId: v.id,
                productName: `Luxury Item ${v.sku}`,
                sku: v.sku,
                variantTitle: v.variantTitle as any,
                quantity: 1,
                price: v.price,
                totalLine: v.price,
              }))
            },
            timelines: {
              create: [
                { action: 'ORDER_CREATED', description: 'Order initiated by customer', createdAt, actorType: 'customer' },
                ...(isPaid ? [{ 
                  action: 'PAYMENT_RECEIVED', 
                  description: 'Payment verified via Global Gateway', 
                  createdAt: new Date(createdAt.getTime() + 3600000), 
                  actorType: 'system' 
                }] : []),
                ...(activeWorkStatuses.includes(status) || status === 'COMPLETED' ? [{
                   action: 'PRODUCTION_STARTED',
                   description: 'Transferred to Digital Atelier',
                   createdAt: new Date(createdAt.getTime() + 86400000),
                   actorType: 'admin',
                   actorId: admin?.id
                }] : [])
              ]
            }
          }
        });

        // Financial Integrity: Create Transaction for Paid Orders
        if (isPaid) {
          await tx.paymentTransaction.create({
            data: {
              orderId: order.id,
              amount: subTotal,
              currency: 'VND',
              status: TransactionStatusEnum.success,
              type: TransactionTypeEnum.payment,
              provider: 'PAYPAL',
              providerTransactionId: `TXN-${order.code}`,
              reconciliationStatus: ReconciliationStatus.MATCHED,
              createdAt: new Date(createdAt.getTime() + 1800000)
            }
          });
        }

        // Inventory Integrity: Reserve Stock for Active Orders
        if (activeWorkStatuses.includes(status)) {
          for (const v of selectedVariants) {
            await tx.inventoryItem.updateMany({
              where: { productVariantId: v.id },
              data: { reservedQuantity: { increment: 1 } }
            });
          }
        }

        return order.id;
      });
    });

    await Promise.all(chunkPromises);
    if ((i + CHUNK_SIZE) % 500 === 0) console.log(`...Simulated ${i + CHUNK_SIZE}/2000 life cycles`);
  }

  console.log('✨ CRM Simulation Complete. Financial Audit should now be Healthy.');
}
