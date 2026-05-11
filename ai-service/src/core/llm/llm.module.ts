import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiClient } from '../../integrations/gemini/gemini.client';
import { OpenAiClient } from '../../integrations/openai/openai.client';

export const CHAT_PROVIDER = 'CHAT_PROVIDER';
export const EMBEDDING_PROVIDER = 'EMBEDDING_PROVIDER';

@Global()
@Module({
  providers: [
    GeminiClient,
    OpenAiClient,
    {
      provide: CHAT_PROVIDER,
      useFactory: (config: ConfigService, gemini: GeminiClient, openai: OpenAiClient) => {
        const provider = config.get<string>('AI_EMBEDDING_PROVIDER');
        return provider === 'openai' ? openai : gemini;
      },
      inject: [ConfigService, GeminiClient, OpenAiClient],
    },
    {
      provide: EMBEDDING_PROVIDER,
      useFactory: (config: ConfigService, gemini: GeminiClient, openai: OpenAiClient) => {
        const provider = config.get<string>('AI_EMBEDDING_PROVIDER');
        return provider === 'openai' ? openai : gemini;
      },
      inject: [ConfigService, GeminiClient, OpenAiClient],
    },
  ],
  exports: [CHAT_PROVIDER, EMBEDDING_PROVIDER],
})
export class LlmModule {}
