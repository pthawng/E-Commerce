import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AttributeController } from './attribute.controller';
import { AttributeService } from './attribute.service';

@Module({
  imports: [PrismaModule],
  controllers: [AttributeController],
  providers: [AttributeService],
  exports: [AttributeService],
})
export class AttributeModule {}
