import { BadRequestException } from '@nestjs/common';
import { ProductCatalogStatus } from '@prisma/client';

export type PublishRuleProduct = {
  collectionId?: string | null;
  primaryCategoryId?: string | null;
  preorderEnabled?: boolean | null;
  pricingApproved?: boolean | null;
  pricing?: { retailPrice?: unknown } | null;
  media?: Array<{ isThumbnail?: boolean | null; url?: string | null }>;
  variants?: Array<{
    catalogInventory?: { stock?: number | null } | null;
  }>;
};

export function validateCatalogStatusTransition(
  product: PublishRuleProduct,
  nextStatus: ProductCatalogStatus,
) {
  const stock =
    product.variants?.reduce(
      (sum, variant) => sum + Number(variant.catalogInventory?.stock ?? 0),
      0,
    ) ?? 0;

  if (nextStatus === ProductCatalogStatus.PUBLISHED) {
    const hasMainImage = product.media?.some((media) => media.isThumbnail && media.url) ?? false;
    const missing: string[] = [];

    if (!product.collectionId) missing.push('collection');
    if (!product.primaryCategoryId) missing.push('category');
    if (!product.pricing?.retailPrice) missing.push('retail price');
    if (!hasMainImage) missing.push('main image');

    if (missing.length) {
      throw new BadRequestException(`Cannot publish product without ${missing.join(', ')}`);
    }

    if (!product.pricingApproved) {
      throw new BadRequestException('Cannot publish product before pricing approval');
    }

    if (stock <= 0) {
      throw new BadRequestException(
        'Cannot publish out-of-stock product; use PRE_ORDER if allowed',
      );
    }
  }

  if (nextStatus === ProductCatalogStatus.PRE_ORDER && !product.preorderEnabled) {
    throw new BadRequestException('PRE_ORDER requires preorderEnabled=true');
  }
}
