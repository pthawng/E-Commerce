import { ChatMessage } from '../../integrations/gemini/gemini.client';

export interface ChatClient {
  generateChat(messages: ChatMessage[]): Promise<string>;
}
