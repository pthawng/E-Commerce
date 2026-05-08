import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CartModule } from '../cart/cart.module';
import { InventoryModule } from '../inventory/inventory.module';
import { MailModule } from '../mail/mail.module';
import { PaymentModule } from '../payment/payment.module';
import { RbacModule } from '../rbac/rbac.module';
import { SystemModule } from '../system/system.module';
import { AdminOrderController } from './admin-order.controller';
import { CheckoutController } from './controllers/checkout.controller';
import { OrderRecoveryController } from './controllers/order-recovery.controller';
import { CleanupExpiredReservationsJob } from './jobs/cleanup-expired-reservations.job';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { CheckoutTokenService } from './services/checkout-token.service';
import { OrderPaymentService } from './services/order-payment.service';
import { RefundService } from './services/refund.service';
import { PriceEngineService } from './services/price-engine.service';
import { CheckoutValidator } from './services/checkout-validator.service';
import { OrderEventConsumer } from './services/order-event.consumer';
import { NerveCenterController } from './nerve-center.controller';




@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'system-events',
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
      },
    }),

    RbacModule,
    CartModule,
    InventoryModule,
    MailModule,
    SystemModule,
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
  controllers: [
    OrderController,
    AdminOrderController,
    CheckoutController,
    OrderRecoveryController,
    NerveCenterController,
  ],

  providers: [
    OrderService,
    OrderPaymentService,
    CheckoutTokenService,
    RefundService,
    PriceEngineService,
    CheckoutValidator,
    CleanupExpiredReservationsJob,

    OrderEventConsumer,
  ],
  exports: [OrderService, OrderPaymentService, CheckoutTokenService, RefundService, PriceEngineService],
})
export class OrderModule { }

