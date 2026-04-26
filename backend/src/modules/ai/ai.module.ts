import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AiController } from './ai.controller';
import { ProductAiSyncListener } from './product-ai-sync.listener';
import { AiService } from './ai.service';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [AiService, ProductAiSyncListener],
  exports: [AiService],
})
export class AiModule {}
