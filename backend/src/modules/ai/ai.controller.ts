import { Public } from '@common/decorators/public.decorator';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';

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
}
