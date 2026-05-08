import { AiService } from './ai.service';

describe('AiService searchProducts', () => {
  let fetchMock: jest.Mock;
  let cacheStore: Map<string, unknown>;
  let cacheManager: {
    get: jest.Mock;
    set: jest.Mock;
  };
  let prisma: {
    product: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let service: AiService;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as any;
    cacheStore = new Map<string, unknown>();
    cacheManager = {
      get: jest.fn(async (key: string) => cacheStore.get(key)),
      set: jest.fn(async (key: string, value: unknown) => {
        cacheStore.set(key, value);
      }),
    };
    prisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const configService = {
      get: jest.fn((key: string, fallback: unknown) => {
        const config: Record<string, unknown> = {
          AI_SERVICE_URL: 'http://ai-service',
          AI_SEARCH_TIMEOUT_MS: 800,
          AI_SEARCH_CACHE_TTL_MS: 120000,
          INTERNAL_SERVICE_TOKEN: 'internal-token',
        };
        return config[key] ?? fallback;
      }),
    };

    service = new AiService(configService as any, prisma as any, cacheManager as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls ai-service search with internal token and filters', async () => {
    fetchMock.mockResolvedValue(
      response({
        query: 'diamond',
        items: [{ productId: 'product-1', score: 0.95, name: 'Diamond Necklace' }],
        source: 'ai',
        cached: false,
        latencyMs: 42,
      }),
    );

    const result = await service.searchProducts(' diamond ', {
      limit: 12,
      category: 'Necklace',
      minPrice: 1000,
      maxPrice: 5000,
    });

    expect(result.source).toBe('ai');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://ai-service/search',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Internal-Token': 'internal-token',
        }),
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      query: 'diamond',
      limit: 12,
      filters: {
        isActive: true,
        category: 'Necklace',
        minPrice: 1000,
        maxPrice: 5000,
      },
    });
  });

  it('falls back to product keyword search when ai-service fails', async () => {
    fetchMock.mockRejectedValue(new Error('ai down'));
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'product-1',
        slug: 'diamond-necklace',
        name: { en: 'Diamond Necklace' },
        displayPriceMin: 1200,
        displayPriceMax: 1200,
        media: [{ url: 'image.jpg', isThumbnail: true }],
        categories: [{ category: { name: { en: 'Necklace' } } }],
      },
    ]);

    const result = await service.searchProducts('diamond', { limit: 1 });

    expect(result.source).toBe('fallback');
    expect(result.items).toEqual([
      {
        productId: 'product-1',
        score: 0,
        slug: 'diamond-necklace',
        imageUrl: 'image.jpg',
        name: 'Diamond Necklace',
        category: 'Necklace',
        price: 1200,
      },
    ]);
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 1,
      }),
    );
  });

  it('varies search cache key by query filters and limit', async () => {
    fetchMock.mockResolvedValue(
      response({
        query: 'diamond',
        items: [{ productId: 'product-1', score: 0.95 }],
        source: 'ai',
        cached: false,
        latencyMs: 10,
      }),
    );

    await service.searchProducts('diamond', { limit: 10 });
    await service.searchProducts('diamond', { limit: 11 });
    await service.searchProducts('diamond', { limit: 10, category: 'Necklace' });

    const keys = cacheManager.get.mock.calls.map(([key]) => key);
    expect(new Set(keys).size).toBe(3);
  });
});

function response(payload: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    text: async () => JSON.stringify(payload),
  };
}
