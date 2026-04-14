import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { CartModule } from '../cart/cart.module';
import { PaymentModule } from '../payment/payment.module';
import { InventoryModule } from '../inventory/inventory.module';
import { OrderController } from './order.controller';
import { AdminOrderController } from './admin-order.controller';
import { OrderService } from './order.service';
import { OrderPaymentService } from './services/order-payment.service';
import { CheckoutController } from './controllers/checkout.controller';
import { CheckoutTokenService } from './services/checkout-token.service';
import { CleanupExpiredReservationsJob } from './jobs/cleanup-expired-reservations.job';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderRecoveryController } from './controllers/order-recovery.controller';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [
        PrismaModule,
        RbacModule,
        CartModule,
        InventoryModule,
        MailModule,
        forwardRef(() => PaymentModule),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_CHECKOUT_SECRET'),
                signOptions: { expiresIn: configService.get<string>('JWT_CHECKOUT_EXPIRES_IN', '15m') as any },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [OrderController, AdminOrderController, CheckoutController, OrderRecoveryController],
    providers: [
        OrderService,
        OrderPaymentService,
        CheckoutTokenService,
        CleanupExpiredReservationsJob,
    ],
    exports: [OrderService, OrderPaymentService, CheckoutTokenService],
})
export class OrderModule { }
