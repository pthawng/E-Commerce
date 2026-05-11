import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { aiChatService, ChatMessage, ChatEnvelope, parseSuggestedProducts } from './ai-chat.service';
import { toast } from 'sonner';

function errorToastMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 429) return 'Quá nhiều yêu cầu. Vui lòng đợi một chút rồi thử lại.';
    if (status !== undefined && status >= 500) return 'Máy chủ đang bận. Vui lòng thử lại sau.';
    if (error.code === 'ECONNABORTED') return 'Hết thời gian chờ. Vui lòng thử lại.';
  }
  return 'Có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại.';
}

export const useAiChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<unknown>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);

  /**
   * Mirror of `messages` kept in a ref so we can read the current value
   * synchronously inside async callbacks without a stale closure.
   * Synced via useEffect after every render — canonical React pattern.
   */
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const sendingRef = useRef(false);

  const sendMessage = useCallback(async (text: string, options?: { retry?: boolean }) => {
    const trimmed = text.trim();
    if (!trimmed || sendingRef.current) return undefined;

    sendingRef.current = true;
    setLastFailedText(null);

    const isRetry = options?.retry === true;

    if (!isRetry) {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMessage]);
    }

    setIsLoading(true);

    try {
      /**
       * History = all messages except the last one (the user message we just added).
       * We read from messagesRef which is the value BEFORE the current render
       * caused by setMessages above — giving us exactly the prior conversation.
       */
      const apiHistory = messagesRef.current;

      const envelope: ChatEnvelope = await aiChatService.sendMessage(trimmed, apiHistory);
      const payload = envelope.data;
      const answer = payload?.answer;

      if (typeof answer !== 'string' || !answer.trim()) {
        throw new Error('Invalid AI response');
      }

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: answer,
        // Runtime-validated — no more `any[]` flowing into the UI
        suggestedProducts: parseSuggestedProducts(payload?.suggestedProducts),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setAnalysis(payload?.analysis ?? null);

      return envelope;
    } catch (error: unknown) {
      setLastFailedText(trimmed);
      toast.error(errorToastMessage(error));
      return undefined;
    } finally {
      setIsLoading(false);
      sendingRef.current = false;
    }
  }, []);

  const retryLast = useCallback(async () => {
    if (!lastFailedText) return undefined;
    return sendMessage(lastFailedText, { retry: true });
  }, [lastFailedText, sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setAnalysis(null);
    setLastFailedText(null);
  }, []);

  return { messages, isLoading, analysis, lastFailedText, sendMessage, retryLast, clearChat };
};
