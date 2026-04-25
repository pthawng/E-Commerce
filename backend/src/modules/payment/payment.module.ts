import { BullAdapter } from '@bull-board/api/bullAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { PaginationModule } from '@common/pagination';
import { RbacModule } from '@modules/rbac/rbac.module';
import { BullModule } from '@nestjs/bull';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { OrderModule } from '../order/order.module';
import { AdminPaymentController } from './admin-payment.controller';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentProcessor } from './processors/payment.processor';
import { PayPalProvider } from './providers/paypal/paypal.provider';
import { VietQRProvider } from './providers/vietqr/vietqr.provider';
import { VNPayProvider } from './providers/vnpay/vnpay.provider';
import { IdempotencyService } from './services/idempotency.service';
import { PaymentStateMachine } from './services/payment-state.machine';
import { PaymentReconciliationService } from './services/reconciliation.service';
import { VietQRMatchingService } from './services/vietqr-matching.service';
import { LedgerModule } from '../ledger/ledger.module';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    forwardRef(() => OrderModule), // Circular dependency resolution
    InventoryModule,
    PaginationModule,
    RbacModule,
    LedgerModule,
    SystemModule,
    BullModule.registerQueue({
      name: 'payment_status',
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullBoardModule.forFeature({
      name: 'payment_status',
      adapter: BullAdapter,
    }),
  ],
  controllers: [PaymentController, AdminPaymentController],
  providers: [
    PaymentService,
    VNPayProvider,
    PayPalProvider,
    VietQRProvider,
    IdempotencyService,
    PaymentStateMachine,
    PaymentProcessor,
    PaymentReconciliationService,
    VietQRMatchingService,
  ],
  exports: [PaymentService],
})
export class PaymentModule { }
