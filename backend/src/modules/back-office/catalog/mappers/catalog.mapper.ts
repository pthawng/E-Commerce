import { ProductCatalogStatus, StockStatus } from '@prisma/client';
import { getProductThumbnailUrl } from '@shared';

type CatalogProduct = any;

function localized(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return (
      (typeof record.vi === 'string' && record.vi) ||
      (typeof record.en === 'string' && record.en) ||
      Object.values(record).find((item): item is string => typeof item === 'string') ||
      ''
    );
  }
  return '';
}

export function toCatalogListItem(product: CatalogProduct) {
  const variant = product.variants?.[0];
  const inventory = variant?.catalogInventory;
  const certificate = product.certificates?.[0];
  const stock = Number(inventory?.stock ?? 0);
  const status =
    stock === 0 && product.catalogStatus === ProductCatalogStatus.PUBLISHED
      ? ProductCatalogStatus.OUT_OF_STOCK
      : product.catalogStatus;

  return {
    id: product.id,
    sku: variant?.sku ?? '',
    name: localized(product.name),
    collection: product.collection?.name ?? null,
    collectionId: product.collectionId,
    category: localized(product.primaryCategory?.name ?? product.categories?.[0]?.category?.name),
    categoryId: product.primaryCategoryId ?? product.categories?.[0]?.categoryId,
    certificate: certificate
      ? `${certificate.authority} ${certificate.certificateNo}`.trim()
      : null,
    retailPrice: Number(
      product.pricing?.retailPrice ?? product.displayPriceMin ?? variant?.price ?? 0,
    ),
    currency: product.pricing?.currency ?? 'EUR',
    stock,
    stockStatus: inventory?.stockStatus ?? StockStatus.IN_STOCK,
    status,
    pricingApproved: Boolean(product.pricingApproved),
    preorderEnabled: Boolean(product.preorderEnabled),
    updatedAt: product.updatedAt,
    thumbnailUrl: getProductThumbnailUrl(product, { fallbackUrl: null }),
  };
}

export function toCatalogDetail(product: CatalogProduct) {
  return {
    ...toCatalogListItem(product),
    slug: product.slug,
    description: localized(product.description),
    variants:
      product.variants?.map((variant: any) => ({
        id: variant.id,
        sku: variant.sku,
        title: localized(variant.variantTitle),
        price: Number(variant.price),
        isDefault: variant.isDefault,
        stock: Number(variant.catalogInventory?.stock ?? 0),
        stockStatus: variant.catalogInventory?.stockStatus ?? StockStatus.IN_STOCK,
        thumbnailUrl: variant.thumbnailUrl,
      })) ?? [],
    pricing: product.pricing
      ? {
          materialCost: Number(product.pricing.materialCost),
          laborCost: Number(product.pricing.laborCost),
          marginMultiplier: Number(product.pricing.marginMultiplier),
          boutiqueCoefficient: Number(product.pricing.boutiqueCoefficient),
          retailPrice: Number(product.pricing.retailPrice),
          currency: product.pricing.currency,
          formulaVersion: product.pricing.formulaVersion,
          approvedAt: product.pricing.approvedAt,
        }
      : null,
    inventory:
      product.variants?.map((variant: any) => ({
        variantId: variant.id,
        sku: variant.sku,
        stock: Number(variant.catalogInventory?.stock ?? 0),
        reservedStock: Number(variant.catalogInventory?.reservedStock ?? 0),
        preorderLimit: variant.catalogInventory?.preorderLimit ?? null,
        stockStatus: variant.catalogInventory?.stockStatus ?? StockStatus.IN_STOCK,
      })) ?? [],
    certificates:
      product.certificates?.map((certificate: any) => ({
        id: certificate.id,
        certificateNo: certificate.certificateNo,
        authority: certificate.authority,
        type: certificate.type,
        gemstone: certificate.gemstone,
        fileUrl: certificate.fileUrl,
        issuedAt: certificate.issuedAt,
      })) ?? [],
    media:
      product.media?.map((media: any) => ({
        id: media.id,
        url: media.url,
        type: media.type,
        altText: media.altText,
        isThumbnail: media.isThumbnail,
        order: media.order,
      })) ?? [],
    workflow: product.publishingWorkflow
      ? {
          id: product.publishingWorkflow.id,
          status: product.publishingWorkflow.status,
          currentStep: product.publishingWorkflow.currentStep,
          steps: product.publishingWorkflow.steps?.map((step: any) => ({
            id: step.id,
            step: step.step,
            status: step.status,
            assignedRole: step.assignedRole,
            completedAt: step.completedAt,
            note: step.note,
          })),
        }
      : null,
    auditLogs:
      product.auditLogs?.map((log: any) => ({
        id: log.id,
        action: log.action,
        actorId: log.actorId,
        before: log.before,
        after: log.after,
        metadata: log.metadata,
        createdAt: log.createdAt,
      })) ?? [],
  };
}
