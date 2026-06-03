import { BadRequestException } from '@nestjs/common';
import { ProductCatalogStatus } from '@prisma/client';
import { validateCatalogStatusTransition } from '../validators/publish-rule.validator';

const publishable = {
  collectionId: 'collection-id',
  primaryCategoryId: 'category-id',
  pricingApproved: true,
  preorderEnabled: false,
  pricing: { retailPrice: 48200 },
  media: [{ isThumbnail: true, url: 'https://cdn.example/product.jpg' }],
  variants: [{ catalogInventory: { stock: 1 } }],
};

describe('validateCatalogStatusTransition', () => {
  it('allows publishing a complete catalog product', () => {
    expect(() =>
      validateCatalogStatusTransition(publishable, ProductCatalogStatus.PUBLISHED),
    ).not.toThrow();
  });

  it('blocks publish when pricing approval is missing', () => {
    expect(() =>
      validateCatalogStatusTransition(
        { ...publishable, pricingApproved: false },
        ProductCatalogStatus.PUBLISHED,
      ),
    ).toThrow(BadRequestException);
  });

  it('blocks publish when stock is zero', () => {
    expect(() =>
      validateCatalogStatusTransition(
        { ...publishable, variants: [{ catalogInventory: { stock: 0 } }] },
        ProductCatalogStatus.PUBLISHED,
      ),
    ).toThrow('out-of-stock');
  });

  it('requires preorder flag for PRE_ORDER status', () => {
    expect(() =>
      validateCatalogStatusTransition(publishable, ProductCatalogStatus.PRE_ORDER),
    ).toThrow(BadRequestException);
  });
});
