import { ChatClient } from '../../core/chat/chat-client.interface';
import { logInfo } from '../../common/logger';

export type UserIntent = 'PRODUCT_DISCOVERY' | 'ORDER_QUERY' | 'GENERAL_INQUIRY' | 'COMPARE_PRODUCTS';

export interface ExtractedEntities {
  category?: string;
  material?: string;
  maxPrice?: number;
  minPrice?: number;
  gender?: string;
}

export interface IntentAnalysis {
  intent: UserIntent;
  entities: ExtractedEntities;
  confidence: number;
}

export class IntentClassifier {
  constructor(private readonly chatClient: ChatClient) {}

  async analyze(message: string): Promise<IntentAnalysis> {
    const prompt = `Analyze the following user message for a luxury jewelry store called "Ray Paradis" and extract the intent and entities.
Return ONLY a JSON object.

User Message: "${message}"

Rules:
1. Intent must be one of: PRODUCT_DISCOVERY, ORDER_QUERY, GENERAL_INQUIRY, COMPARE_PRODUCTS.
2. Entities to extract:
   - category: e.g., "Rings", "Necklaces", "Earrings", "Bracelets".
   - material: e.g., "Gold", "Diamond", "Emerald", "Ruby", "Silver", "Platinum".
   - maxPrice: a number (if mentioned).
   - minPrice: a number (if mentioned).
   - gender: "Men" or "Women" (if mentioned).

Example Output:
{
  "intent": "PRODUCT_DISCOVERY",
  "entities": { "category": "Rings", "material": "Diamond", "maxPrice": 50000000 },
  "confidence": 0.95
}
`;

    try {
      const response = await this.chatClient.generateChat([
        { role: 'system', content: 'You are a precise data extractor. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ]);

      // Simple JSON extraction from response string
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      
      const analysis = JSON.parse(jsonMatch[0]) as IntentAnalysis;
      logInfo('intent.classified', { message, analysis });
      
      return analysis;
    } catch (e) {
      logInfo('intent.classification.failed', { message, error: String(e) });
      return {
        intent: 'PRODUCT_DISCOVERY',
        entities: {},
        confidence: 0.5
      };
    }
  }
}
