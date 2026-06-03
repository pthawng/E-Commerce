import {
  PrismaClient,
  ProductCatalogStatus,
  StockStatus,
  WorkflowStepStatus,
} from '@prisma/client';
import { PERMISSION_SEEDS } from '../../../modules/rbac/permissions.seed';
import { SeedScript } from '../utils/history';

const products = [
  [
    'Solstice Solitaire',
    'RP-2104-S',
    'bridal',
    'eternity',
    'GIA 6471290214',
    48200,
    4,
    ProductCatalogStatus.PUBLISHED,
    true,
  ],
  [
    'Nocturne Riviera Necklace',
    'RP-1987-N',
    'high-jewelry',
    'necklaces',
    'SSEF 124881',
    186000,
    1,
    ProductCatalogStatus.PUBLISHED,
    true,
  ],
  [
    'Aurora Pave Earrings',
    'RP-3201-E',
    'atelier-prive',
    'earrings',
    'GIA pending',
    22400,
    12,
    ProductCatalogStatus.DRAFT,
    false,
  ],
  [
    'Meridien Tennis Bracelet',
    'RP-2899-B',
    'signature',
    'bracelets',
    'GIA 2185930472',
    34800,
    0,
    ProductCatalogStatus.OUT_OF_STOCK,
    true,
  ],
  [
    'Empress Ruby Cocktail',
    'RP-4012-R',
    'high-jewelry',
    'rings',
    'Gubelin GR-2891',
    312500,
    1,
    ProductCatalogStatus.PRE_ORDER,
    true,
  ],
  [
    'Lumiere Pearl Strand',
    'RP-2750-P',
    'heritage',
    'necklaces',
    'CIBJO Cert.',
    18900,
    6,
    ProductCatalogStatus.PUBLISHED,
    true,
  ],
  [
    'Cassiopée Diamond Cuff',
    'RP-3318-C',
    'high-jewelry',
    'bracelets',
    'GIA pending',
    428000,
    1,
    ProductCatalogStatus.WORKSHOP_REVIEW,
    false,
  ],
] as const;

const collections = [
  ['Bridal', 'bridal'],
  ['High Jewelry', 'high-jewelry'],
  ['Atelier Prive', 'atelier-prive'],
  ['Signature', 'signature'],
  ['Heritage', 'heritage'],
];

const categories = [
  ['Eternity', 'eternity'],
  ['Rings', 'rings'],
  ['Necklaces', 'necklaces'],
  ['Bracelets', 'bracelets'],
  ['Earrings', 'earrings'],
];

const workflowSteps = [
  'DRAFT',
  'MEDIA_CONTENT_REVIEW',
  'PRICING_REVIEW',
  'BOUTIQUE_DISTRIBUTION',
  'ONLINE',
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const v8_backoffice_catalog: SeedScript = {
  version: 'v8',
  name: 'Back-office Catalog Permissions and Demo Data',
  run: async (prisma: PrismaClient) => {
    for (const p of PERMISSION_SEEDS) {
      await prisma.permission.upsert({
        where: { action: p.action },
        update: { name: p.name, module: p.module as any },
        create: { action: p.action, name: p.name, module: p.module as any },
      });
    }

    const superAdmin = await prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
    if (superAdmin) {
      const allPermissions = await prisma.permission.findMany();
      await prisma.rolePermission.createMany({
        data: allPermissions.map((permission) => ({
          roleId: superAdmin.id,
          permissionId: permission.id,
        })),
        skipDuplicates: true,
      });
    }

    for (const [name, slug] of collections) {
      await prisma.collection.upsert({
        where: { slug },
        update: { name, isActive: true, deletedAt: null },
        create: { name, slug, updatedAt: new Date() },
      });
    }

    for (const [name, slug] of categories) {
      await prisma.category.upsert({
        where: { slug },
        update: { name: { en: name, vi: name }, isActive: true },
        create: { slug, name: { en: name, vi: name }, isActive: true },
      });
    }

    await prisma.pricingFormula.create({
      data: {
        version: 1,
        materialCost: 0,
        laborCost: 0,
        marginMultiplier: 4.2,
        boutiqueCoefficient: 0,
        currency: 'EUR',
        isActive: true,
        updatedAt: new Date(),
      },
    });

    for (const [
      name,
      sku,
      collectionSlug,
      categorySlug,
      certificate,
      price,
      stock,
      status,
      pricingApproved,
    ] of products) {
      const collection = await prisma.collection.findUniqueOrThrow({
        where: { slug: collectionSlug },
      });
      const category = await prisma.category.findUniqueOrThrow({ where: { slug: categorySlug } });
      const slug = slugify(name);

      const product = await prisma.product.upsert({
        where: { slug },
        update: {
          name: { en: name, vi: name },
          collectionId: collection.id,
          primaryCategoryId: category.id,
          catalogStatus: status,
          preorderEnabled: status === ProductCatalogStatus.PRE_ORDER,
          pricingApproved,
          displayPriceMin: price,
          displayPriceMax: price,
          isActive: status !== ProductCatalogStatus.DRAFT,
        },
        create: {
          name: { en: name, vi: name },
          slug,
          description: {
            en: `${name} is a Ray Paradis back-office catalog reference.`,
            vi: `${name} là mẫu thiết kế trong catalog nội bộ Ray Paradis.`,
          },
          collectionId: collection.id,
          primaryCategoryId: category.id,
          catalogStatus: status,
          preorderEnabled: status === ProductCatalogStatus.PRE_ORDER,
          pricingApproved,
          displayPriceMin: price,
          displayPriceMax: price,
          hasVariants: false,
          isActive: status !== ProductCatalogStatus.DRAFT,
        },
      });

      await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: product.id, categoryId: category.id } },
        update: {},
        create: { productId: product.id, categoryId: category.id },
      });

      const variant = await prisma.productVariant.upsert({
        where: { sku },
        update: {
          productId: product.id,
          price,
          isDefault: true,
          thumbnailUrl: `https://placehold.co/900x900/15130f/d4af37?text=${encodeURIComponent(sku)}`,
        },
        create: {
          productId: product.id,
          sku,
          price,
          variantTitle: { en: 'Default', vi: 'Mặc định' },
          isDefault: true,
          thumbnailUrl: `https://placehold.co/900x900/15130f/d4af37?text=${encodeURIComponent(sku)}`,
        },
      });

      await prisma.productPricing.upsert({
        where: { productId: product.id },
        update: {
          materialCost: Math.round(price * 0.2),
          laborCost: Math.round(price * 0.08),
          marginMultiplier: 4.2,
          boutiqueCoefficient: Math.round(price * 0.02),
          retailPrice: price,
          approvedAt: pricingApproved ? new Date() : null,
        },
        create: {
          productId: product.id,
          materialCost: Math.round(price * 0.2),
          laborCost: Math.round(price * 0.08),
          marginMultiplier: 4.2,
          boutiqueCoefficient: Math.round(price * 0.02),
          retailPrice: price,
          approvedAt: pricingApproved ? new Date() : undefined,
        },
      });

      await prisma.productInventory.upsert({
        where: { productVariantId: variant.id },
        update: {
          stock,
          stockStatus:
            stock === 0
              ? StockStatus.OUT_OF_STOCK
              : status === ProductCatalogStatus.PRE_ORDER
                ? StockStatus.PRE_ORDER
                : stock <= 2
                  ? StockStatus.LOW_STOCK
                  : StockStatus.IN_STOCK,
        },
        create: {
          productVariantId: variant.id,
          stock,
          stockStatus:
            stock === 0
              ? StockStatus.OUT_OF_STOCK
              : status === ProductCatalogStatus.PRE_ORDER
                ? StockStatus.PRE_ORDER
                : stock <= 2
                  ? StockStatus.LOW_STOCK
                  : StockStatus.IN_STOCK,
          updatedAt: new Date(),
        },
      });

      if (
        !(await prisma.productMedia.findFirst({
          where: { productId: product.id, isThumbnail: true },
        }))
      ) {
        await prisma.productMedia.create({
          data: {
            productId: product.id,
            url: `https://placehold.co/900x900/15130f/d4af37?text=${encodeURIComponent(name)}`,
            isThumbnail: true,
            order: 0,
          },
        });
      }

      await prisma.productCertificate.deleteMany({ where: { productId: product.id } });
      await prisma.productCertificate.create({
        data: {
          productId: product.id,
          variantId: variant.id,
          certificateNo: certificate,
          authority: certificate.split(/\s+/)[0] || 'GIA',
        },
      });

      await prisma.publishingWorkflow.upsert({
        where: { productId: product.id },
        update: {
          status:
            status === ProductCatalogStatus.PUBLISHED
              ? 'LIVE'
              : status === ProductCatalogStatus.DRAFT
                ? 'DRAFT'
                : 'IN_REVIEW',
          currentStep:
            status === ProductCatalogStatus.PUBLISHED
              ? 'ONLINE'
              : status === ProductCatalogStatus.WORKSHOP_REVIEW
                ? 'PRICING_REVIEW'
                : 'DRAFT',
          steps: {
            deleteMany: {},
            create: workflowSteps.map((step) => ({
              step,
              status:
                status === ProductCatalogStatus.PUBLISHED
                  ? WorkflowStepStatus.COMPLETED
                  : step === 'DRAFT'
                    ? WorkflowStepStatus.IN_PROGRESS
                    : WorkflowStepStatus.PENDING,
            })),
          },
        },
        create: {
          productId: product.id,
          status:
            status === ProductCatalogStatus.PUBLISHED
              ? 'LIVE'
              : status === ProductCatalogStatus.DRAFT
                ? 'DRAFT'
                : 'IN_REVIEW',
          currentStep:
            status === ProductCatalogStatus.PUBLISHED
              ? 'ONLINE'
              : status === ProductCatalogStatus.WORKSHOP_REVIEW
                ? 'PRICING_REVIEW'
                : 'DRAFT',
          steps: {
            create: workflowSteps.map((step) => ({
              step,
              status:
                status === ProductCatalogStatus.PUBLISHED
                  ? WorkflowStepStatus.COMPLETED
                  : step === 'DRAFT'
                    ? WorkflowStepStatus.IN_PROGRESS
                    : WorkflowStepStatus.PENDING,
            })),
          },
        },
      });
    }
  },
};
