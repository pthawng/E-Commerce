import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ProductEmbeddingPayload } from '../common/types/recommendation.types';
import { EmbeddingPipeline } from '../pipelines/embedding.pipeline';

@Processor('product-embeddings')
export class EmbeddingWorker extends WorkerHost {
  private readonly logger = new Logger(EmbeddingWorker.name);

  constructor(private readonly pipeline: EmbeddingPipeline) {
    super();
  }

  async process(job: Job<ProductEmbeddingPayload>): Promise<void> {
    this.logger.log(`Processing embedding for product: ${job.data.id}`);
    try {
      await this.pipeline.processProduct(job.data);
      this.logger.log(`Successfully indexed product: ${job.data.id}`);
    } catch (error) {
      this.logger.error(`Failed to index product ${job.data.id}: ${error}`);
      throw error;
    }
  }
}
