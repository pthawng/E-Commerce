import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { PaginationService } from './pagination.service';
import { QueryCostService } from './query-cost.service';

@Module({
  imports: [CacheModule.register()],
  providers: [PaginationService, QueryCostService],
  exports: [PaginationService, QueryCostService],
})
export class PaginationModule {}
