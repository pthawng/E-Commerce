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

import { AllExceptionFilter } from '@common/filters/all-exception.filter';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    logger: isProduction ? ['error', 'warn'] : ['log', 'debug', 'error', 'warn', 'verbose'],
  });

  app.use(cookieParser());

  app.setGlobalPrefix('api');

  // CORS Configuration
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : [];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Authorization, Accept, x-client-session-id, x-idempotency-key, x-csrf-token',
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

  await app.listen(process.env.PORT ?? 4000);
}

bootstrap();
