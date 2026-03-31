import { PrismaClient } from '@prisma/client';

export async function seedLogistics(prisma: PrismaClient) {
  console.log('🚀 Seeding Logistics (Warehouses & Shipping)...');

  // 1. Warehouses
  const warehouses = [
    { code: 'WH-HANOI', name: 'Main Warehouse (Hanoi)', address: { city: 'Hanoi', province: 'Hanoi', country: 'VN' } },
    { code: 'WH-HCM', name: 'Southern Hub (HCM)', address: { city: 'Ho Chi Minh City', province: 'HCM', country: 'VN' } },
  ];

  for (const w of warehouses) {
    await prisma.warehouse.upsert({
      where: { code: w.code },
      update: { name: w.name, address: w.address },
      create: { 
        code: w.code, 
        name: w.name, 
        address: w.address,
        isActive: true 
      },
    });
  }
  console.log('✅ Synced 2 warehouses.');

  // 2. Shipping Methods (Using stable UUIDs for idempotency)
  const shippingMethods = [
    { 
      id: '550e8400-e29b-41d4-a716-446655440001', // Stable UUID 1
      name: 'Standard Delivery', 
      providerCode: 'GHTK', 
      baseFee: 30000, 
      description: { vi: 'Giao hàng tiêu chuẩn (3-5 ngày)', en: 'Standard shipping (3-5 days)' } 
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440002', // Stable UUID 2
      name: 'Express 24h', 
      providerCode: 'Ahamove', 
      baseFee: 80000, 
      description: { vi: 'Giao hàng hỏa tốc trong 24h', en: 'Express delivery in 24h' } 
    },
  ];

  for (const s of shippingMethods) {
    await prisma.shippingMethod.upsert({
      where: { id: s.id },
      update: { 
        name: s.name, 
        baseFee: s.baseFee, 
        description: s.description,
        providerCode: s.providerCode 
      },
      create: { 
        id: s.id,
        name: s.name, 
        providerCode: s.providerCode, 
        baseFee: s.baseFee, 
        description: s.description as any,
        isActive: true 
      },
    });
  }
  console.log('✅ Synced 2 shipping methods.');
}
