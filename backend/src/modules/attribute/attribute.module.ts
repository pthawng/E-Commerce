import { RbacModule } from '@modules/rbac/rbac.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AttributeController } from './attribute.controller';
import { AdminAttributeController } from './admin-attribute.controller';
import { AttributeService } from './attribute.service';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [AttributeController, AdminAttributeController],
  providers: [AttributeService],
  exports: [AttributeService],
})
export class AttributeModule {}
