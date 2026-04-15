import { AttributeModule } from '@modules/attribute/attribute.module';
import { AuthModule } from '@modules/auth/auth.module';
import { JwtAccessGuard } from '@modules/auth/guard/access-jwt.guard';
import { CartModule } from '@modules/cart/cart.module';
import { CategoryModule } from '@modules/category/category.module';
import { InventoryModule } from '@modules/inventory/inventory.module';
import { MailModule } from '@modules/mail/mail.module';
import { OrderModule } from '@modules/order/order.module';
import { PaymentModule } from '@modules/payment/payment.module';
import { ProductModule } from '@modules/product/product.module';
import { RbacModule } from '@modules/rbac/rbac.module';
import { StorageModule } from '@modules/storage/storage.module';
import { UserModule } from '@modules/user/user.module';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CsrfGuard } from './common/guards/csrf.guard';
import { SessionBindingGuard } from './common/guards/session-binding.guard';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { SessionMiddleware } from './common/middleware/session.middleware';
import { bullConfigFactory, cacheConfigFactory } from './config/redis.config';
import { PrismaModule } from './prisma/prisma.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(4000),
        DATABASE_URL: Joi.string().uri().required(),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRES: Joi.string().default('7d'),
        REDIS_HOST: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.string().default('localhost'),
        }),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().allow('', null).default(''),
        REDIS_URL: Joi.string().optional().allow('', null),
        REDIS_TTL: Joi.number().default(60000),
        MAIL_PROVIDER: Joi.string().valid('gmail', 'sendgrid').default('gmail'),
        SENDGRID_API_KEY: Joi.string().when('MAIL_PROVIDER', {
          is: 'sendgrid',
          then: Joi.required(),
          otherwise: Joi.string().optional(),
        }),
        MAIL_FROM: Joi.string().required(),
        COMPANY_NAME: Joi.string().required(),
        GMAIL_CLIENT_ID: Joi.string().when('MAIL_PROVIDER', {
          is: 'gmail',
          then: Joi.required(),
          otherwise: Joi.string().optional(),
        }),
        GMAIL_CLIENT_SECRET: Joi.string().when('MAIL_PROVIDER', {
          is: 'gmail',
          then: Joi.required(),
          otherwise: Joi.string().optional(),
        }),
        GMAIL_REFRESH_TOKEN: Joi.string().when('MAIL_PROVIDER', {
          is: 'gmail',
          then: Joi.required(),
          otherwise: Joi.string().optional(),
        }),
        GMAIL_USER: Joi.string().when('MAIL_PROVIDER', {
          is: 'gmail',
          then: Joi.required(),
          otherwise: Joi.string().optional(),
        }),
        SUPABASE_URL: Joi.string().required(),
        SUPABASE_ANON_KEY: Joi.string().required(),
        SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
        SUPABASE_BUCKET: Joi.string().required(),
        CORS_ORIGIN: Joi.string().required(),
        FRONTEND_URL: Joi.string().required(),
      }),
    }),
    ScheduleModule.forRoot(), // NEW: Enable cron jobs
    PrometheusModule.register({
      path: '/metrics',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL') || 60000,
          limit: config.get<number>('THROTTLE_LIMIT') || 10,
        },
      ],
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    MailModule,
    RbacModule,
    StorageModule,
    ProductModule,
    CategoryModule,
    AttributeModule,
    CartModule,
    OrderModule,
    PaymentModule,
    InventoryModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: bullConfigFactory,
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: cacheConfigFactory,
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Set JwtAccessGuard làm global guard
    // Tất cả routes sẽ được bảo vệ bởi authentication
    // Trừ các routes có @Public() decorator
    {
      provide: APP_GUARD,
      useClass: JwtAccessGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SessionBindingGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityMiddleware, SessionMiddleware).forRoutes('*');
  }
}
