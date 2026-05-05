import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import type { ProductEmbeddingPayload, RecommendationResponse, SimilarProduct } from '@shared';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiServiceUrl: string;
  private readonly recommendationTimeoutMs: number;
  private readonly embeddingTimeoutMs: number;
  private readonly recommendationCacheTtlMs: number;
  private readonly internalToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:4100');
    this.recommendationTimeoutMs = this.configService.get<number>('AI_QUERY_TIMEOUT_MS', 500);
    this.embeddingTimeoutMs = this.configService.get<number>('AI_EMBED_TIMEOUT_MS', 3000);
    this.recommendationCacheTtlMs = this.configService.get<number>(
      'AI_RECOMMENDATION_CACHE_TTL_MS',
      10 * 60 * 1000,
    );
    this.internalToken = this.configService.get<string>('INTERNAL_SERVICE_TOKEN', 'dev_internal_token_123');
  }

  async syncProduct(payload: ProductEmbeddingPayload): Promise<void> {
    const startedAt = Date.now();

    await this.request(`${this.aiServiceUrl}/products/embed`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, this.embeddingTimeoutMs);

    this.logger.log(`Synced product ${payload.id} to ai-service in ${Date.now() - startedAt}ms`);
  }

  async getRecommendations(productId: string, limit: number = 4): Promise<RecommendationResponse> {
    const normalizedLimit = clampLimit(limit);
    const cacheKey =
      normalizedLimit === 4 ? `recommend:${productId}` : `recommend:${productId}:${normalizedLimit}`;
    const cached = await this.cacheManager.get<RecommendationResponse>(cacheKey);

    if (cached) {
      return {
        ...cached,
        cached: true,
      };
    }

    try {
      const response = await this.request<RecommendationResponse>(
        `${this.aiServiceUrl}/recommendations?productId=${encodeURIComponent(productId)}&limit=${normalizedLimit}`,
        { method: 'GET' },
        this.recommendationTimeoutMs,
      );

      if (!response.items?.length) {
        throw new Error('AI service returned no recommendations');
      }

      const freshResponse: RecommendationResponse = {
        productId,
        items: response.items.slice(0, normalizedLimit),
        source: 'ai',
        cached: false,
      };

      await this.cacheManager.set(cacheKey, freshResponse, this.recommendationCacheTtlMs).catch(() => undefined);
      return freshResponse;
    } catch (error) {
      this.logger.warn(
        `AI recommendations failed for ${productId}: ${error instanceof Error ? error.message : 'unknown error'}. Falling back.`,
      );

      const fallback = await this.getFallbackRecommendations(productId, normalizedLimit);
      await this.cacheManager.set(cacheKey, fallback, this.recommendationCacheTtlMs).catch(() => undefined);
      return fallback;
    }
  }

  private async getFallbackRecommendations(
    productId: string,
    limit: number,
  ): Promise<RecommendationResponse> {
    const currentProduct = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        categories: {
          select: {
            categoryId: true,
          },
        },
      },
    });

    const primaryCategoryId = currentProduct?.categories?.[0]?.categoryId;

    const primary = await this.prisma.product.findMany({
      where: {
        id: { not: productId },
        deletedAt: null,
        isActive: true,
        ...(primaryCategoryId
          ? {
              categories: {
                some: {
                  categoryId: primaryCategoryId,
                },
              },
            }
          : {}),
      },
      include: {
        media: {
          orderBy: { order: 'asc' },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    });

    const seenIds = new Set(primary.map((item) => item.id));
    let fallbackProducts = primary;

    if (fallbackProducts.length < limit) {
      const secondary = await this.prisma.product.findMany({
        where: {
          id: {
            notIn: [productId, ...Array.from(seenIds)],
          },
          deletedAt: null,
          isActive: true,
        },
        include: {
          media: {
            orderBy: { order: 'asc' },
          },
          categories: {
            include: {
              category: true,
            },
          },
        },
        orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
        take: limit - fallbackProducts.length,
      });

      fallbackProducts = [...fallbackProducts, ...secondary];
    }

    return {
      productId,
      items: fallbackProducts.slice(0, limit).map((product) => this.mapFallbackProduct(product)),
      source: 'fallback',
      cached: false,
    };
  }

  private mapFallbackProduct(product: any): SimilarProduct {
    const thumbnail = product.media?.find((media: any) => media.isThumbnail) ?? product.media?.[0];

    return {
      productId: product.id,
      score: 0,
      slug: product.slug,
      imageUrl: thumbnail?.url,
      name: getLocalizedValue(product.name),
      category: getLocalizedValue(product.categories?.[0]?.category?.name),
      price: Number(product.displayPriceMin ?? product.displayPriceMax ?? 0),
    };
  }

  private async request<T>(url: string, init: RequestInit, timeoutMs: number): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': this.internalToken,
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ai-service`);
    }

    return payload as T;
  }
}

function clampLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit)) return 4;
  return Math.max(1, Math.min(limit, 10));
}

function getLocalizedValue(value: unknown): string {
  if (!value) return '';

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    const localized = value as Record<string, unknown>;
    return (
      (typeof localized.vi === 'string' && localized.vi) ||
      (typeof localized.en === 'string' && localized.en) ||
      Object.values(localized).find((item): item is string => typeof item === 'string') ||
      ''
    );
  }

  return '';
}
