import { BadRequestException } from '@nestjs/common';
import { AiController } from './ai.controller';

describe('AiController', () => {
  const aiService = {
    getRecommendations: jest.fn(),
    searchProducts: jest.fn(),
  };
  const controller = new AiController(aiService as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires q for AI search', async () => {
    await expect(controller.searchProducts('   ')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('passes parsed AI search params to AiService', async () => {
    aiService.searchProducts.mockResolvedValue({
      query: 'diamond',
      items: [],
      source: 'ai',
      cached: false,
      latencyMs: 10,
    });

    await controller.searchProducts('diamond', '12', 'Necklace', '1000', '5000');

    expect(aiService.searchProducts).toHaveBeenCalledWith('diamond', {
      limit: 12,
      category: 'Necklace',
      minPrice: 1000,
      maxPrice: 5000,
    });
  });
});
