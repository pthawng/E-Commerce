import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CartModule } from '../cart/cart.module';
import { InventoryModule } from '../inventory/inventory.module';
import { MailModule } from '../mail/mail.module';
import { PaymentModule } from '../payment/payment.module';
import { RbacModule } from '../rbac/rbac.module';
import { AdminOrderController } from './admin-order.controller';
import { CheckoutController } from './controllers/checkout.controller';
import { OrderRecoveryController } from './controllers/order-recovery.controller';
import { CleanupExpiredReservationsJob } from './jobs/cleanup-expired-reservations.job';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { CheckoutTokenService } from './services/checkout-token.service';
import { OrderPaymentService } from './services/order-payment.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    RbacModule,
    CartModule,
    InventoryModule,
    MailModule,
    forwardRef(() => PaymentModule),
    forwardRef(() => AuthModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_CHECKOUT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_CHECKOUT_EXPIRES_IN', '15m') as any,
        },
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
