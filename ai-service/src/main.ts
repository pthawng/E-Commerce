import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('AI_SERVICE_PORT', 4100);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Simple Global Auth Guard (Internal Token)
  const internalToken = configService.get<string>('INTERNAL_SERVICE_TOKEN');
  if (internalToken) {
    app.use((req: any, res: any, next: any) => {
      // Skip health check
      if (req.url === '/health') return next();
      
      const token = req.headers['x-internal-token'];
      if (token !== internalToken) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      next();
    });
  }

  await app.listen(port);
  logger.log(`AI Service is running on: http://localhost:${port}`);
}

bootstrap();
