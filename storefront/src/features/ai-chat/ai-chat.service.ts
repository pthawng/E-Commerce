import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from '@shared';

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  suggestedProducts?: any[];
}

export interface ChatResponse {
  success: boolean;
  data: {
    answer: string;
    suggestedProducts?: any[];
    analysis?: any;
  };
  message?: string;
}

class AiChatService {
  async sendMessage(message: string, history: ChatMessage[] = []): Promise<ChatResponse> {
    const url = buildApiUrl(API_ENDPOINTS.AI.CHAT);
    const response = await axios.post(url, {
      message,
      history: history.map(h => ({
        role: h.role === 'model' ? 'assistant' : h.role,
        content: h.content,
        suggestedProducts: h.suggestedProducts
      }))
    });

    return response.data;
  }
}

export const aiChatService = new AiChatService();
