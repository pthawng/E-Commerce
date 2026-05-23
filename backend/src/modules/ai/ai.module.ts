import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ProductAiSyncListener } from './product-ai-sync.listener';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [AiService, ProductAiSyncListener],
  exports: [AiService],
})
export class AiModule {}
