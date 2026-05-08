import { useState, useCallback } from 'react';
import { aiChatService, ChatMessage, ChatResponse } from './ai-chat.service';
import { toast } from 'sonner';

export const useAiChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Ensure history doesn't have trailing user messages (which happens if a previous call failed)
      // Gemini/LLMs require alternating user/model roles.
      const cleanHistory = [...messages];
      while (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === 'user') {
        cleanHistory.pop();
      }

      const response = await aiChatService.sendMessage(text, cleanHistory);
      console.log('AI Response:', response);
      
      // The backend returns a wrapped response: { success: true, data: { answer, analysis, suggestedProducts } }
      const aiData = response.data;
      
      const aiMessage: ChatMessage = { 
        role: 'model', 
        content: aiData.answer,
        suggestedProducts: aiData.suggestedProducts
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setAnalysis(aiData.analysis);
      
      return response;
    } catch (error) {
      console.error('AI Chat Error:', error);
      toast.error('Có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setAnalysis(null);
  }, []);

  return {
    messages,
    isLoading,
    analysis,
    sendMessage,
    clearChat
  };
};
