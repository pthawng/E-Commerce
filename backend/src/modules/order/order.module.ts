import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CartModule } from '../cart/cart.module';
import { PaymentModule } from '../payment/payment.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderPaymentService } from './services/order-payment.service';
import { CleanupExpiredReservationsJob } from './jobs/cleanup-expired-reservations.job';

@Module({
    imports: [
        PrismaModule,
        CartModule,
        forwardRef(() => PaymentModule), // Circular dependency resolution
    ],
    controllers: [OrderController],
    providers: [
        OrderService,
        OrderPaymentService,
        CleanupExpiredReservationsJob,
    ],
    exports: [OrderService, OrderPaymentService],
})
export class OrderModule { }
