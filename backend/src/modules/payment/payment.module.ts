import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OrderModule } from '../order/order.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { VietQRProvider } from './providers/vietqr/vietqr.provider';
import { PayPalProvider } from './providers/paypal/paypal.provider';
import { VNPayProvider } from './providers/vnpay/vnpay.provider';
import { IdempotencyService } from './services/idempotency.service';

@Module({
    imports: [
        ConfigModule,
        PrismaModule,
        forwardRef(() => OrderModule), // Circular dependency resolution
    ],
    controllers: [PaymentController],
    providers: [
        PaymentService,
        VNPayProvider,
        PayPalProvider,
        VietQRProvider,
        IdempotencyService,
    ],
    exports: [PaymentService],
})
export class PaymentModule { }
