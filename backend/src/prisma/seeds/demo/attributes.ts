import { Logger } from '@nestjs/common';
import { AttributeInputType, PrismaClient } from '@prisma/client';

const logger = new Logger('DemoAttributes');

export async function seedAttributes(prisma: PrismaClient) {
  logger.log('💎 Seeding High-End Jewelry Attributes (Attribute/Value Schema)...');

  // 1. Cleanup old legacy codes to avoid duplicates in UI
  const legacyCodes = [
    'clarity',
    'cut',
    'color-grade',
    'material-type',
    'carat-weight',
    'material',
  ];
  await prisma.attribute.deleteMany({ where: { code: { in: legacyCodes } } });

  const attributes = [
    // --- Technical Specifications (Matches frontend technicalCodes) ---
    {
      code: 'material_type',
      name: { vi: 'Chất liệu', en: 'Material' },
      values: ['Gold', 'Platinum', 'Rose Gold', 'White Gold', 'Silver'],
      type: AttributeInputType.select,
    },
    {
      code: 'material_purity',
      name: { vi: 'Độ tinh khiết kim loại', en: 'Material Purity' },
      values: ['14k', '18k', '22k', '24k', 'PT950', 'PT900', '925'],
      type: AttributeInputType.select,
    },
    {
      code: 'stone_type',
      name: { vi: 'Loại đá quý', en: 'Stone Type' },
      values: ['Diamond', 'Sapphire', 'Ruby', 'Emerald', 'Opal', 'Topaz', 'Pearl'],
      type: AttributeInputType.select,
    },
    {
      code: 'stone_clarity',
      name: { vi: 'Độ tinh khiết đá', en: 'Stone Clarity' },
      values: ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'],
      type: AttributeInputType.select,
    },
    {
      code: 'stone_cut',
      name: { vi: 'Vết cắt', en: 'Cut' },
      values: ['Excellent', 'Very Good', 'Good', 'Fair'],
      type: AttributeInputType.select,
    },
    {
      code: 'certification',
      name: { vi: 'Chứng nhận', en: 'Certification' },
      values: ['GIA', 'IGI', 'HRD', 'SJC', 'DOJI'],
      type: AttributeInputType.select,
    },
    {
      code: 'ring_size',
      name: { vi: 'Size nhẫn', en: 'Ring Size' },
      values: ['4', '5', '6', '7', '8', '9', '10', '11', '12'],
      type: AttributeInputType.select,
    },

    // --- Marketing & Classification ---
    {
      code: 'carat',
      name: { vi: 'Trọng lượng (Carat)', en: 'Carat Weight' },
      values: ['0.3', '0.5', '0.7', '1.0', '1.5', '2.0', '3.0', '5.0'],
      type: AttributeInputType.select,
    },
    {
      code: 'color_grade',
      name: { vi: 'Cấp độ màu', en: 'Color Grade' },
      values: ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'Fancy'],
      type: AttributeInputType.select,
    },
    {
      code: 'collection',
      name: { vi: 'Bộ sưu tập', en: 'Collection' },
      values: ['Heritage', 'Modernist', 'Bridal', 'Celestial', 'Limited Edition'],
      type: AttributeInputType.select,
    },
    {
      code: 'gender',
      name: { vi: 'Giới tính', en: 'Gender' },
      values: ['Unisex', 'Women', 'Men'],
      type: AttributeInputType.select,
    },
  ];

  for (const attr of attributes) {
    const createdAttr = await prisma.attribute.upsert({
      where: { code: attr.code },
      update: {
        name: attr.name,
        filterType: attr.type,
      },
      create: {
        code: attr.code,
        name: attr.name,
        filterType: attr.type,
      },
    });

    // Seed values with order
    for (let i = 0; i < attr.values.length; i++) {
      const val = attr.values[i];
      // Note: We use the value itself as part of a lookup or unique identifier if possible.
      // Since AttributeValue doesn't have a unique constraint on (attributeId, value),
      // we check manually to prevent duplicates.
      const existingValue = await prisma.attributeValue.findFirst({
        where: {
          attributeId: createdAttr.id,
          value: { path: ['en'], equals: val },
        },
      });

      if (!existingValue) {
        await prisma.attributeValue.create({
          data: {
            attributeId: createdAttr.id,
            value: { vi: val, en: val },
            order: i,
          },
        });
      } else {
        await prisma.attributeValue.update({
          where: { id: existingValue.id },
          data: { order: i },
        });
      }
    }
  }

  logger.log('✅ Semantic Attributes Synced and Categorized.');
}
