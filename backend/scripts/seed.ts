// src/scripts/seed.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { RbacService } from '../src/modules/rbac/rbac.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const rbacService = app.get(RbacService);

  await rbacService['seedDefaultPermissions']();

  await app.close();
}

bootstrap();
