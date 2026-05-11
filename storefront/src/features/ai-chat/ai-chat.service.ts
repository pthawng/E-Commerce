import axiosInstance from '@/services/axiosClient';
import { buildApiUrl, API_ENDPOINTS } from '@shared';

/** Must match backend `ai-chat.dto.ts` */
export const AI_CHAT_LIMITS = {
  MESSAGE_MAX: 4000,
  HISTORY_MAX_MESSAGES: 40,
} as const;

/** Client timeout slightly above backend AI chat timeout */
const AI_CHAT_REQUEST_TIMEOUT_MS = 45_000;

export interface SuggestedProduct {
  slug: string;
  name: string;
  category?: string;
  price?: number;
  imageUrl?: string;
  material?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  suggestedProducts?: SuggestedProduct[];
}

export interface ChatPayload {
  answer: string;
  suggestedProducts?: unknown;
  analysis?: unknown;
}

/** Nest `ResponseInterceptor` envelope */
export interface ChatEnvelope {
  success: boolean;
  data: ChatPayload | null;
  message?: string;
}

/** Runtime type guard — validates each product object coming from the API */
function isSuggestedProduct(val: unknown): val is SuggestedProduct {
  if (!val || typeof val !== 'object') return false;
  const v = val as Record<string, unknown>;
  return typeof v.slug === 'string' && typeof v.name === 'string';
}

/** Safely parse the `suggestedProducts` field from any API response */
export function parseSuggestedProducts(raw: unknown): SuggestedProduct[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isSuggestedProduct);
}

class AiChatService {
  async sendMessage(message: string, history: ChatMessage[] = []): Promise<ChatEnvelope> {
    const url = buildApiUrl(API_ENDPOINTS.AI.CHAT);
    const response = await axiosInstance.post<ChatEnvelope>(
      url,
      {
        message,
        history: history.map((h) => ({
          role: h.role === 'model' ? 'assistant' : h.role,
          content: h.content,
        })),
      },
      { timeout: AI_CHAT_REQUEST_TIMEOUT_MS },
    );

    return response.data;
  }
}

export const aiChatService = new AiChatService();
