import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import type {
  AiSearchResponse,
  AiSearchResult,
  ProductEmbeddingPayload,
  RecommendationResponse,
  SimilarProduct,
} from '@shared';
import type { Cache } from 'cache-manager';
import { PrismaService } from 'src/prisma/prisma.service';

interface AiSearchOptions {
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface NormalizedAiSearchOptions {
  limit: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiServiceUrl: string;
  private readonly recommendationTimeoutMs: number;
  private readonly embeddingTimeoutMs: number;
  private readonly searchTimeoutMs: number;
  private readonly searchCacheTtlMs: number;
  private readonly recommendationCacheTtlMs: number;
  private readonly internalToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:4100');
    this.recommendationTimeoutMs = Number(this.configService.get('AI_QUERY_TIMEOUT_MS', 500));
    this.embeddingTimeoutMs = Number(this.configService.get('AI_EMBED_TIMEOUT_MS', 3000));
    this.searchTimeoutMs = Number(this.configService.get('AI_SEARCH_TIMEOUT_MS', 800));
    this.searchCacheTtlMs = Number(this.configService.get('AI_SEARCH_CACHE_TTL_MS', 2 * 60 * 1000));
    this.recommendationCacheTtlMs = Number(
      this.configService.get('AI_RECOMMENDATION_CACHE_TTL_MS', 10 * 60 * 1000),
    );
    this.internalToken = this.configService.get<string>(
      'INTERNAL_SERVICE_TOKEN',
      'dev_internal_token_123',
    );
  }

  async syncProduct(payload: ProductEmbeddingPayload): Promise<void> {
    const startedAt = Date.now();

    await this.request(
      `${this.aiServiceUrl}/products/embed`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      this.embeddingTimeoutMs,
    );

    this.logger.log(`Synced product ${payload.id} to ai-service in ${Date.now() - startedAt}ms`);
  }

  async getRecommendations(productId: string, limit: number = 4): Promise<RecommendationResponse> {
    const normalizedLimit = clampLimit(limit);
    const cacheKey =
      normalizedLimit === 4
        ? `recommend:${productId}`
        : `recommend:${productId}:${normalizedLimit}`;
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

      await this.cacheManager
        .set(cacheKey, freshResponse, this.recommendationCacheTtlMs)
        .catch(() => undefined);
      return freshResponse;
    } catch (error) {
      this.logger.warn(
        `AI recommendations failed for ${productId}: ${error instanceof Error ? error.message : 'unknown error'}. Falling back.`,
      );

      const fallback = await this.getFallbackRecommendations(productId, normalizedLimit);
      await this.cacheManager
        .set(cacheKey, fallback, this.recommendationCacheTtlMs)
        .catch(() => undefined);
      return fallback;
    }
  }

  async searchProducts(query: string, options: AiSearchOptions = {}): Promise<AiSearchResponse> {
    const normalizedQuery = query.trim();
    const normalizedLimit = clampSearchLimit(options.limit);
    const normalizedOptions = normalizeSearchOptions(options, normalizedLimit);
    const cacheKey = buildSearchCacheKey(normalizedQuery, normalizedOptions);
    const cached = await this.cacheManager.get<AiSearchResponse>(cacheKey);

    if (cached) {
      return {
        ...cached,
        cached: true,
      };
    }

    try {
      const response = await this.request<AiSearchResponse>(
        `${this.aiServiceUrl}/search`,
        {
          method: 'POST',
          body: JSON.stringify({
            query: normalizedQuery,
            limit: normalizedLimit,
            filters: {
              isActive: true,
              ...(normalizedOptions.category ? { category: normalizedOptions.category } : {}),
              ...(normalizedOptions.minPrice !== undefined
                ? { minPrice: normalizedOptions.minPrice }
                : {}),
              ...(normalizedOptions.maxPrice !== undefined
                ? { maxPrice: normalizedOptions.maxPrice }
                : {}),
            },
          }),
        },
        this.searchTimeoutMs,
      );

      if (!response.items?.length) {
        throw new Error('AI service returned no search results');
      }

      const freshResponse: AiSearchResponse = {
        query: normalizedQuery,
        items: response.items.slice(0, normalizedLimit),
        source: 'ai',
        cached: false,
        latencyMs: response.latencyMs,
      };

      await this.cacheManager
        .set(cacheKey, freshResponse, this.searchCacheTtlMs)
        .catch(() => undefined);
      return freshResponse;
    } catch (error) {
      this.logger.warn(
        `AI search failed for "${normalizedQuery}": ${error instanceof Error ? error.message : 'unknown error'}. Falling back.`,
      );

      const fallback = await this.getFallbackSearchResults(normalizedQuery, normalizedOptions);
      await this.cacheManager.set(cacheKey, fallback, this.searchCacheTtlMs).catch(() => undefined);
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

  async chat(message: string, history?: any[]): Promise<any> {
    const startedAt = Date.now();
    const timeoutMs = Number(this.configService.get('AI_CHAT_TIMEOUT_MS', 30000));

    try {
      const response = await this.request<any>(
        `${this.aiServiceUrl}/chat`,
        {
          method: 'POST',
          body: JSON.stringify({ message, history }),
        },
        timeoutMs,
      );

      this.logger.log(`Chat response generated in ${Date.now() - startedAt}ms`);
      return response;
    } catch (error) {
      this.logger.error(
        `AI chat failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw error;
    }
  }

  private async getFallbackSearchResults(
    query: string,
    options: NormalizedAiSearchOptions,
  ): Promise<AiSearchResponse> {
    const startedAt = Date.now();
    const searchLower = query.toLowerCase();
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      isActive: true,
      OR: [
        { name: { path: ['vi'], string_contains: searchLower } },
        { name: { path: ['en'], string_contains: searchLower } },
        { slug: { contains: searchLower, mode: 'insensitive' } },
      ],
      ...(options.category
        ? {
            categories: {
              some: {
                category: {
                  OR: [
                    { name: { path: ['vi'], string_contains: options.category.toLowerCase() } },
                    { name: { path: ['en'], string_contains: options.category.toLowerCase() } },
                    { slug: { contains: options.category.toLowerCase(), mode: 'insensitive' } },
                  ],
                },
              },
            },
          }
        : {}),
      ...(options.minPrice !== undefined ? { displayPriceMax: { gte: options.minPrice } } : {}),
      ...(options.maxPrice !== undefined ? { displayPriceMin: { lte: options.maxPrice } } : {}),
    };

    const products = await this.prisma.product.findMany({
      where,
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
      take: options.limit,
    });

    return {
      query,
      items: products.map((product) => this.mapFallbackSearchProduct(product)),
      source: 'fallback',
      cached: false,
      latencyMs: Date.now() - startedAt,
    };
  }

  private mapFallbackSearchProduct(product: any): AiSearchResult {
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

function clampSearchLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit)) return 12;
  return Math.max(1, Math.min(limit, 50));
}

function normalizeSearchOptions(
  options: AiSearchOptions,
  limit: number,
): NormalizedAiSearchOptions {
  return {
    limit,
    category: options.category?.trim() || undefined,
    minPrice: options.minPrice,
    maxPrice: options.maxPrice,
  };
}

function buildSearchCacheKey(query: string, options: NormalizedAiSearchOptions): string {
  return `search:${JSON.stringify({
    q: query.toLowerCase(),
    limit: options.limit,
    category: options.category?.toLowerCase() ?? null,
    minPrice: options.minPrice ?? null,
    maxPrice: options.maxPrice ?? null,
  })}`;
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
