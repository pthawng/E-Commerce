import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';
import { NotificationListener } from './notification.listener';
import { NotificationService } from './notification.service';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway, NotificationListener],
  exports: [NotificationService],
})
export class NotificationModule {}
