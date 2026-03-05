import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { CartModule } from '../cart/cart.module';
import { PaymentModule } from '../payment/payment.module';
import { OrderController } from './order.controller';
import { AdminOrderController } from './admin-order.controller';
import { OrderService } from './order.service';
import { OrderPaymentService } from './services/order-payment.service';
import { CleanupExpiredReservationsJob } from './jobs/cleanup-expired-reservations.job';

@Module({
    imports: [
        PrismaModule,
        RbacModule,
        CartModule,
        forwardRef(() => PaymentModule), // Circular dependency resolution
    ],
    controllers: [OrderController, AdminOrderController],
    providers: [
        OrderService,
        OrderPaymentService,
        CleanupExpiredReservationsJob,
    ],
    exports: [OrderService, OrderPaymentService],
})
export class OrderModule { }
