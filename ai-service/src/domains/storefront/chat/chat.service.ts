import { ChatClient } from '../../../core/chat/chat-client.interface';
import { SearchEngine } from '../../../capabilities/search/search.engine';
import { ChatMessage } from '../../../integrations/gemini/gemini.client';
import { logInfo } from '../../../common/logger';
import { IntentClassifier } from '../../../capabilities/intent/intent.classifier';

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  answer: string;
  suggestedProducts?: any[];
  analysis?: any;
}

export class ChatService {
  private readonly intentClassifier: IntentClassifier;

  constructor(
    private readonly chatClient: ChatClient,
    private readonly searchEngine: SearchEngine,
  ) {
    this.intentClassifier = new IntentClassifier(chatClient);
  }

  async handleMessage(request: ChatRequest): Promise<ChatResponse> {
    logInfo('chat.message.received', { message: request.message });

    try {
      // 1. Intent Analysis & Entity Extraction (Stage 0)
      const analysis = await this.intentClassifier.analyze(request.message);

      // 2. Multi-stage Retrieval (Stage 1: Hybrid Search)
      const searchResponse = await this.searchEngine.searchProducts({
        query: request.message,
        limit: 5,
        filters: analysis.intent === 'PRODUCT_DISCOVERY' ? {
          category: analysis.entities.category,
          material: analysis.entities.material,
          minPrice: analysis.entities.minPrice,
          maxPrice: analysis.entities.maxPrice,
          gender: analysis.entities.gender,
        } : undefined,
      });
      
      const searchResults = searchResponse.items;
      const products = searchResults.map((r: any) => ({
        name: r.name,
        price: r.price,
        category: r.category,
        slug: r.slug,
        material: r.material,
      }));

      // 3. Generation (Stage 2)
      const systemPrompt = `You are a helpful and elegant luxury jewelry expert assistant for "Ray Paradis". 
Your goal is to assist customers in finding the perfect jewelry. 

User Intent: ${analysis.intent}
Extracted Entities: ${JSON.stringify(analysis.entities)}

Current Product Catalog Context (Top Recommendations):
${products.map((p: any) => `- ${p.name} (${p.category}${p.material ? `, ${p.material}` : ''}): ${p.price.toLocaleString('vi-VN')} VND. Link: /products/${p.slug}`).join('\n')}

Guidelines:
- Be professional, warm, and sophisticated.
- Use the extracted entities to confirm with the user (e.g., "I found some beautiful Diamond rings for you...").
- If the intent is ORDER_QUERY, tell them you can help but need them to provide their Order ID or login to their account.
- Always respond in the same language as the user.
- If no relevant products are found, answer based on your general knowledge but mention you can help them find something specific if they describe it.
- Keep responses concise but helpful.
`;

      // 4. Generate Response
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...(request.history || []),
        { role: 'user', content: request.message },
      ];

      const answer = await this.chatClient.generateChat(messages);

      return {
        answer,
        suggestedProducts: searchResults.length > 0 ? searchResults : undefined,
        analysis,
      };
    } catch (error) {
      logInfo('chat.handleMessage.failed', { message: request.message, error: String(error) });
      throw error;
    }
  }
}
