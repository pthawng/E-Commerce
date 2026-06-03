import { ProductCatalogStatus, StockStatus } from '@prisma/client';
import {
  PRODUCT_MEDIA_FALLBACK_URL,
  getProductGalleryMedia,
  getProductThumbnail,
  getProductThumbnailUrl,
  isVideoMedia,
} from '@shared';
import { toCatalogListItem } from '../mappers/catalog.mapper';

describe('catalog media display policy', () => {
  it('uses the primary media thumbnailUrl when present', () => {
    const result = getProductThumbnail({
      media: [
        {
          url: 'https://cdn.example/primary-original.jpg',
          thumbnailUrl: 'https://cdn.example/primary-thumb.jpg',
          type: 'image',
          isThumbnail: true,
          order: 0,
        },
      ],
    });

    expect(result).toMatchObject({
      url: 'https://cdn.example/primary-thumb.jpg',
      source: 'primary-thumbnail',
      mediaType: 'image',
      isFallback: false,
    });
  });

  it('uses an image asset url when no thumbnailUrl exists', () => {
    expect(
      getProductThumbnailUrl({
        media: [{ url: 'https://cdn.example/asset.jpg', type: 'image', order: 0 }],
      }),
    ).toBe('https://cdn.example/asset.jpg');
  });

  it('uses the configured fallback when product has no media', () => {
    const result = getProductThumbnail(null);

    expect(result).toMatchObject({
      url: PRODUCT_MEDIA_FALLBACK_URL,
      source: 'fallback',
      isFallback: true,
    });
  });

  it('does not use a video file as an image thumbnail without a thumbnailUrl', () => {
    const videoAsset = {
      url: 'https://cdn.example/product-spin.mp4',
      type: 'video',
      isThumbnail: true,
      order: 0,
    };

    expect(isVideoMedia(videoAsset)).toBe(true);
    expect(getProductThumbnail({ media: [videoAsset] })).toMatchObject({
      url: PRODUCT_MEDIA_FALLBACK_URL,
      source: 'video-fallback',
      mediaType: 'video',
      isFallback: true,
    });
  });

  it('uses video fallback for variant-only video gallery media', () => {
    expect(
      getProductGalleryMedia(
        { media: [] },
        {
          variant: {
            media: [
              {
                url: 'https://cdn.example/variant-spin.mp4',
                type: 'video',
                order: 0,
              },
            ],
          },
        },
      ),
    ).toEqual([
      expect.objectContaining({
        url: PRODUCT_MEDIA_FALLBACK_URL,
        source: 'video-fallback',
        mediaType: 'video',
        isFallback: true,
      }),
    ]);
  });

  it('maps back-office catalog thumbnail through the shared policy', () => {
    const product = {
      id: 'product-1',
      name: { vi: 'Nhan kim cuong', en: 'Diamond ring' },
      collection: { name: 'Signature' },
      collectionId: 'collection-1',
      primaryCategory: { name: { vi: 'Nhan', en: 'Rings' } },
      primaryCategoryId: 'category-1',
      categories: [],
      catalogStatus: ProductCatalogStatus.PUBLISHED,
      preorderEnabled: false,
      pricingApproved: true,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      media: [
        {
          id: 'media-video',
          url: 'https://cdn.example/spin.mp4',
          type: 'video',
          isThumbnail: true,
          order: 0,
        },
      ],
      variants: [
        {
          sku: 'RP-001',
          thumbnailUrl: 'https://cdn.example/variant-thumb.jpg',
          catalogInventory: { stock: 3, stockStatus: StockStatus.IN_STOCK },
          price: 1000,
        },
      ],
      certificates: [],
      pricing: { retailPrice: 1200, currency: 'EUR' },
    };

    expect(toCatalogListItem(product).thumbnailUrl).toBe('https://cdn.example/variant-thumb.jpg');
  });
});
