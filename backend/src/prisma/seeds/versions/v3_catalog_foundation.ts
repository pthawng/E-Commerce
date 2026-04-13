import { PrismaClient } from '@prisma/client';
import { SeedScript } from '../utils/history';

export const v3_catalog_foundation: SeedScript = {
  version: 'v3',
  name: 'Catalog Foundation (Attributes & Root Categories)',
  run: async (prisma: PrismaClient) => {
    // 1. Attributes
    const attributes = [
      {
        code: 'material',
        name: { vi: 'Chất liệu', en: 'Material' },
        values: [
          { value: { vi: 'Vàng 18k', en: '18k Gold' }, metaValue: '#D4AF37' },
          { value: { vi: 'Bạch kim', en: 'Platinum' }, metaValue: '#E5E4E2' },
          { value: { vi: 'Kim Cương', en: 'Diamond' }, metaValue: '#FFFFFF' },
        ]
      }
    ];

    for (const attr of attributes) {
      await prisma.attribute.upsert({
        where: { code: attr.code },
        update: { name: attr.name },
        create: {
          code: attr.code,
          name: attr.name,
          values: {
            create: attr.values.map(v => ({
              value: v.value,
              metaValue: v.metaValue
            }))
          }
        }
      });
    }

    // 2. Root Categories
    const categories = [
      { name: { en: 'Rings', vi: 'Nhẫn' }, slug: 'rings' },
      { name: { en: 'Necklaces', vi: 'Vòng cổ' }, slug: 'necklaces' },
      { name: { en: 'Bracelets', vi: 'Lắc tay' }, slug: 'bracelets' },
      { name: { en: 'Earrings', vi: 'Bông tai' }, slug: 'earrings' },
    ];

    for (const cat of categories) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name },
        create: {
          slug: cat.slug,
          name: cat.name,
          isActive: true
        }
      });
    }
  }
};
