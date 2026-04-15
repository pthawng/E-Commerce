import { Module } from '@nestjs/common';
import { makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CartCleanupService } from './cart-cleanup.service';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [PrismaModule],
  controllers: [CartController],
  providers: [
    CartService,
    CartCleanupService,
    makeCounterProvider({
      name: 'cart_concurrency_conflicts_total',
      help: 'Total number of cart concurrency conflicts (409)',
    }),
    makeHistogramProvider({
      name: 'cart_operation_duration_seconds',
      help: 'Duration of cart operations in seconds',
      labelNames: ['operation'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    }),
  ],
  exports: [CartService],
})
export class CartModule {}
