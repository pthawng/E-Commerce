import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '@nestjs-modules/ioredis';
import { TerminusModule } from '@nestjs/terminus';

import { LlmModule } from './core/llm/llm.module';
import { QdrantClient } from './integrations/qdrant/qdrant.client';
import { EmbeddingService } from './core/embedding/embedding.service';
import { SearchEngine } from './capabilities/search/search.engine';
import { ChatService } from './domains/storefront/chat/chat.service';
import { AiController } from './api/ai.controller';
import { RecommendationService } from './capabilities/recommendation/recommendation.service';
import { StorefrontRecommendationService } from './domains/storefront/recommendation/recommendation.service';
import { EmbeddingPipeline } from './pipelines/embedding.pipeline';
import { EmbeddingWorker } from './pipelines/embedding.worker';
import { RetrievalEngine } from './capabilities/retrieval/retrieval.engine';
import { RankingEngine } from './capabilities/ranking/ranking.engine';
import { IntentClassifier } from './capabilities/intent/intent.classifier';
import { RecommendationEngine } from './capabilities/recommendation/recommendation.engine';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get<string>('REDIS_URL', 'redis://localhost:6379'),
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL', 'redis://localhost:6379'),
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'product-embeddings',
    }),
    TerminusModule,
    LlmModule,
  ],
  controllers: [AiController],
  providers: [
    QdrantClient,
    EmbeddingService,
    SearchEngine,
    ChatService,
    RecommendationService,
    StorefrontRecommendationService,
    EmbeddingPipeline,
    EmbeddingWorker,
    RetrievalEngine,
    RankingEngine,
    IntentClassifier,
    RecommendationEngine,
  ],
})
export class AppModule {}
