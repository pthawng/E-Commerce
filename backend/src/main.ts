import { otelSDK } from './otel-sdk';
otelSDK.start();

import { register } from 'tsconfig-paths';

// Dynamically register paths to resolve either `dist/` (runtime) or `src/` (ts-node runtime)
register({
  baseUrl: __dirname,
  paths: {
    '@modules/*': ['modules/*'],
    '@common/*': ['common/*'],
    '@config/*': ['config/*'],
    '@database/*': ['database/*'],
  },
});

import * as dotenv from 'dotenv';
import { validateEnv } from '@config/env.validator';

// Load environment variable file and Validate/Freeze BEFORE anything else
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: envFile });
validateEnv();

import { AllExceptionFilter } from '@common/filters/all-exception.filter';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV');
  const isProduction = nodeEnv === 'production';

  // Support Render.com proxy trust for correct rate limiting
  if (isProduction) {
    // @ts-ignore - set() exists on Express instance
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  app.useLogger(isProduction ? ['error', 'warn'] : ['log', 'debug', 'error', 'warn', 'verbose']);
  app.use(cookieParser());
  app.setGlobalPrefix('api', {
    exclude: ['/', '/health', '/metrics'],
  });

  // CORS Configuration
  const corsOrigins = configService.get<string[]>('CORS_ORIGIN') ?? [];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Authorization, Accept, x-client-session-id, x-idempotency-key, x-csrf-token, x-order-access-token',
  });

  // Bật global validation pipe ( Chuẩn hóa dữ liệu đầu vào )
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Chỉ nhận field có trong DTO
      forbidNonWhitelisted: true, // Nếu client gửi field thừa → 400
      transform: true, // Tự cast type (string → number)
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Bật global response interceptor ( Chuẩn hóa dữ liệu đầu ra )
  app.useGlobalInterceptors(new ResponseInterceptor());
  // Bật global exception filter ( Chuẩn hóa lỗi trả về )
  app.useGlobalFilters(new AllExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Ray Paradis API')
    .setDescription('Dự án E-Commerce Ray Paradis REST API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT') ?? 4000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap();
