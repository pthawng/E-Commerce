import { AttributeModule } from '@modules/attribute/attribute.module';
import { AuthModule } from '@modules/auth/auth.module';
import { JwtAccessGuard } from '@modules/auth/guard/access-jwt.guard';
import { CategoryModule } from '@modules/category/category.module';
import { MailModule } from '@modules/mail/mail.module';
import { ProductModule } from '@modules/product/product.module';
import { RbacModule } from '@modules/rbac/rbac.module';
import { StorageModule } from '@modules/storage/storage.module';
import { UserModule } from '@modules/user/user.module';
import { CartModule } from '@modules/cart/cart.module';
import { OrderModule } from '@modules/order/order.module';
import { PaymentModule } from '@modules/payment/payment.module';
import { InventoryModule } from '@modules/inventory/inventory.module';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { redisStore } from 'cache-manager-redis-yet';
import * as Joi from 'joi';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(4000),
        DATABASE_URL: Joi.string().required(),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRES: Joi.string().default('7d'),
        REDIS_HOST: Joi.string().allow('', null).default('localhost'),
        REDIS_PORT: Joi.number().allow('', null).default(6379),
        REDIS_PASSWORD: Joi.string().allow('', null).default('redis_secure_pass_123'),
        REDIS_URL: Joi.string().optional().allow('', null),
        REDIS_TTL: Joi.number().default(60000),
        MAIL_PROVIDER: Joi.string().valid('gmail', 'sendgrid').default('gmail'),
        SENDGRID_API_KEY: Joi.string().when('MAIL_PROVIDER', {
          is: 'sendgrid',
          then: Joi.required(),
          otherwise: Joi.string().optional(),
        }),
        MAIL_FROM: Joi.string().when('MAIL_PROVIDER', {
          is: 'sendgrid',
          then: Joi.required(),
          otherwise: Joi.string().optional(),
        }),
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
        GMAIL_REDIRECT_URI: Joi.string().optional(),
        SUPABASE_URL: Joi.string().required(),
        SUPABASE_ANON_KEY: Joi.string().required(),
        SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
        SUPABASE_BUCKET: Joi.string().required(),
        // Payment configuration
        VNPAY_TMN_CODE: Joi.string().optional(),
        VNPAY_HASH_SECRET: Joi.string().optional(),
        VNPAY_URL: Joi.string().optional(),
        VNPAY_RETURN_URL: Joi.string().optional(),
        VNPAY_API_URL: Joi.string().optional(),
        PAYPAL_CLIENT_ID: Joi.string().optional(),
        PAYPAL_CLIENT_SECRET: Joi.string().optional(),
        PAYPAL_MODE: Joi.string().valid('sandbox', 'production').default('sandbox'),
        PAYPAL_WEBHOOK_ID: Joi.string().optional(),
        FRONTEND_URL: Joi.string().default('http://localhost:5173'),
        PAYMENT_TIMEOUT_MINUTES: Joi.number().default(15),
        THROTTLE_TTL: Joi.number().default(60000),
        THROTTLE_LIMIT: Joi.number().default(10),
      }),
    }),
    ScheduleModule.forRoot(), // NEW: Enable cron jobs
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
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('RedisConfig');
        const url = process.env.REDIS_URL || configService.get<string>('REDIS_URL');
        
        let redisOptions: any;

        if (url && url.trim() !== '') {
          logger.log(`[Bull] Connecting via URL (length: ${url.length})`);
          try {
            // Basic manual parsing to handle redis://:pass@host:port
            const match = url.match(/redis:\/\/:(.*)@(.*):(\d+)/) || url.match(/redis:\/\/(.*):(\d+)/);
            if (match && match.length >= 3) {
              if (match.length === 4) {
                redisOptions = {
                  password: match[1],
                  host: match[2],
                  port: parseInt(match[3], 10),
                };
              } else {
                redisOptions = {
                  host: match[1],
                  port: parseInt(match[2], 10),
                };
              }
            } else {
              // Fallback to direct URL if parsing fails, but ioredis might still need maxRetriesPerRequest
              return { redis: url }; 
            }
          } catch (e) {
            return { redis: url };
          }
        } else {
          redisOptions = {
            host: process.env.REDIS_HOST || configService.get('REDIS_HOST') || 'localhost',
            port: Number(process.env.REDIS_PORT || configService.get('REDIS_PORT') || 6379),
            password: process.env.REDIS_PASSWORD || configService.get('REDIS_PASSWORD'),
          };
        }
        
        if (redisOptions) {
          logger.log(`[Bull] Connecting via Host: ${redisOptions.host}, Port: ${redisOptions.port}`);
          return {
            redis: {
              ...redisOptions,
              maxRetriesPerRequest: null, // Critical for Bull compatibility
            },
          };
        }

        return { redis: url || 'localhost:6379' };
      },
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('CacheConfig');
        const url = process.env.REDIS_URL || configService.get<string>('REDIS_URL');
        const host = process.env.REDIS_HOST || configService.get('REDIS_HOST') || 'localhost';
        const port = process.env.REDIS_PORT || configService.get('REDIS_PORT') || 6379;
        const password = process.env.REDIS_PASSWORD || configService.get('REDIS_PASSWORD');

        const redisUrl = (url && url.trim() !== '') 
          ? url 
          : password 
            ? `redis://:${password}@${host}:${port}`
            : `redis://${host}:${port}`;

        logger.log(`[Cache] Using Redis at ${redisUrl.split('@')[1] || redisUrl.split('//')[1] || 'localhost'}`);

        return {
          store: await redisStore({
            url: redisUrl,
            ttl: configService.get('REDIS_TTL') || 600, // 10 minutes default
          }),
        };
      },
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
  ],
})
export class AppModule { }
