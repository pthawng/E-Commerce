import { AllExceptionFilter } from '@common/filters/all-exception.filter';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  await app.listen(process.env.PORT ?? 4000);
}

bootstrap();
