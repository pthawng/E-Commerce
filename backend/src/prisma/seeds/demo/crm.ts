import {
  OrderStatusEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
  PrismaClient,
  UserType,
  LuxurySegment
} from '@prisma/client';
import * as argon2 from 'argon2';

const ARGON_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  timeCost: 2,
  memoryCost: 19456,
  parallelism: 1,
};

export async function seedCRM(prisma: PrismaClient) {
  console.log('👥 Generating 100 Mock Customers & 500 Orders...');

  const passwordHash = await argon2.hash('customer123', ARGON_OPTIONS);
  const firstNames = ['Minh', 'Anh', 'Lan', 'Tuấn', 'Hùng', 'Linh', 'Thảo', 'Dương', 'Sơn', 'Trang'];
  const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ'];
  const segments: LuxurySegment[] = ['PROSPECT', 'ACTIVE', 'LOYAL', 'VIP', 'VVIP', 'VIC'];

  const cities = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
  const districts = ['Quận 1', 'Quận 3', 'Quận Cầu Giấy', 'Quận Hoàn Kiếm', 'Quận Hai Bà Trưng'];
  const wards = ['Phường 1', 'Phường 2', 'Phường 3', 'Phường Tràng Tiền', 'Phường Bến Nghé'];

  const customers: any[] = [];

  for (let i = 0; i < 100; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${lastName} ${firstName} ${i + 1}`;
    const email = `customer${i + 1}@example.com`;
    const segment = segments[Math.floor(Math.random() * segments.length)];

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        fullName,
        passwordHash,
        userType: UserType.CUSTOMER,
        isActive: true,
        isEmailVerified: true,
        segment,
        phone: `0987${Math.floor(100000 + Math.random() * 900000)}`,
      },
    });
    customers.push(user);
  }

  const variants: any[] = await prisma.productVariant.findMany({
    take: 50,
  });

  if (variants.length === 0) {
    console.error('❌ No product variants found. Please seed catalog first.');
    return;
  }

  const orderStatuses: OrderStatusEnum[] = [
    'PENDING_PAYMENT', 'CONFIRMED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'
  ];

  for (let i = 0; i < 500; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    const paymentStatus: PaymentStatusEnum = status === 'COMPLETED' || status === 'DELIVERED' ? 'paid' : 'unpaid';
    
    const itemsCount = Math.floor(Math.random() * 3) + 1;
    const selectedVariants: any[] = [];
    let subTotal = 0;

    for (let j = 0; j < itemsCount; j++) {
      const v = variants[Math.floor(Math.random() * variants.length)];
      selectedVariants.push(v);
      subTotal += Number(v.price);
    }

    const orderCode = `RP-${Math.floor(100000 + Math.random() * 900000)}-${i}`;
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Random date in last 90 days

    await prisma.order.create({
      data: {
        code: orderCode,
        userId: customer.id,
        status,
        paymentStatus,
        totalAmount: subTotal,
        subTotal,
        currency: 'VND',
        createdAt: date,
        shippingAddress: {
          name: customer.fullName,
          phone: customer.phone,
          city: cities[Math.floor(Math.random() * cities.length)],
          district: districts[Math.floor(Math.random() * districts.length)],
          ward: wards[Math.floor(Math.random() * wards.length)],
          detail: `${Math.floor(Math.random() * 500) + 1} Đường Lê Lợi`,
        },
        paymentMethod: PaymentMethodEnum.PAYPAL,
        items: {
          create: selectedVariants.map(v => ({
            productVariantId: v.id,
            productName: `Product ${v.sku}`,
            sku: v.sku,
            variantTitle: v.variantTitle as any,
            quantity: 1,
            price: v.price,
            totalLine: v.price,
          }))
        }
      }
    });

    if (i % 100 === 0) console.log(`...Generated ${i}/500 orders`);
  }
}
