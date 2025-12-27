import { AllExceptionFilter } from '@common/filters/all-exception.filter';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  // Enable CORS for the frontend origin and allow credentials (cookies).
  // Do NOT use '*' when requests use credentials (withCredentials: true).

  app.enableCors({
    origin: [process.env.CORS_ORIGIN || 'http://localhost:5173', 'http://localhost:8080'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, Accept',
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
