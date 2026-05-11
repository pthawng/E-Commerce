import { Injectable, Inject, Logger } from '@nestjs/common';
import { CHAT_PROVIDER } from '../../core/llm/llm.module';
import { ChatProvider } from '../../core/llm/llm-provider.interface';
import { ProductSearchResult } from '../../common/types/recommendation.types';

@Injectable()
export class RankingEngine {
  private readonly logger = new Logger(RankingEngine.name);

  constructor(@Inject(CHAT_PROVIDER) private readonly chatClient: ChatProvider) {}

  async rerank(
    query: string,
    candidates: ProductSearchResult[],
  ): Promise<ProductSearchResult[]> {
    if (candidates.length <= 1) return candidates;

    const prompt = `Rank the following luxury jewelry products based on their relevance to the user's search query: "${query}".
Return ONLY a comma-separated list of product indices in order of relevance (e.g., "2,0,1").

Products:
${candidates.map((c, i) => `${i}. ${c.name} (${c.category}) - ${c.price} VND`).join('\n')}
`;

    try {
      const response = await this.chatClient.generateChat([
        { role: 'system', content: 'You are a ranking expert. Order products by relevance.' },
        { role: 'user', content: prompt }
      ]);

      const indices = response
        .split(',')
        .map(i => parseInt(i.trim(), 10))
        .filter(i => !isNaN(i) && i >= 0 && i < candidates.length);

      if (indices.length === 0) return candidates;

      // Reorder candidates
      const ranked = indices.map(i => candidates[i]);
      
      // Add any candidates that the LLM missed at the end
      const missing = candidates.filter(c => !ranked.includes(c));
      
      return [...ranked, ...missing];
    } catch (e) {
      this.logger.warn(`Reranking failed, falling back to original order: ${e}`);
      return candidates;
    }
  }
}
