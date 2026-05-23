import { Public } from '@common/decorators/public.decorator';
import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { AiChatDto } from './dto/ai-chat.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('recommendations')
  @Public()
  @ApiOperation({ summary: 'Get AI-powered product recommendations' })
  @ApiQuery({ name: 'productId', required: true })
  @ApiQuery({ name: 'limit', required: false, example: 4 })
  @ApiResponse({ status: 200, description: 'Recommended products' })
  async getRecommendations(@Query('productId') productId?: string, @Query('limit') limit?: string) {
    if (!productId) {
      throw new BadRequestException('productId is required');
    }

    return this.aiService.getRecommendations(productId, limit ? Number(limit) : undefined);
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search products using AI semantic search' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'limit', required: false, example: 12 })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiResponse({ status: 200, description: 'Semantic product search results' })
  async searchProducts(
    @Query('q') query?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    if (!query?.trim()) {
      throw new BadRequestException('q is required');
    }

    const parsedLimit = parseOptionalNumber(limit, 'limit');
    const parsedMinPrice = parseOptionalNumber(minPrice, 'minPrice');
    const parsedMaxPrice = parseOptionalNumber(maxPrice, 'maxPrice');

    if (
      parsedMinPrice !== undefined &&
      parsedMaxPrice !== undefined &&
      parsedMinPrice > parsedMaxPrice
    ) {
      throw new BadRequestException('minPrice must be less than or equal to maxPrice');
    }

    return this.aiService.searchProducts(query, {
      limit: parsedLimit,
      category,
      minPrice: parsedMinPrice,
      maxPrice: parsedMaxPrice,
    });
  }

  @Post('chat')
  @Public()
  @Throttle({ strict: { limit: 15, ttl: 60000 } })
  @ApiOperation({ summary: 'Interact with the AI chatbot' })
  @ApiResponse({ status: 200, description: 'AI chatbot response' })
  async chat(@Body() body: AiChatDto) {
    return this.aiService.chat(body.message, body.history);
  }
}

function parseOptionalNumber(value: string | undefined, field: string): number | undefined {
  if (value === undefined || value === '') return undefined;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new BadRequestException(`${field} must be a non-negative number`);
  }

  return parsed;
}
