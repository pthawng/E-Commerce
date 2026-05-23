import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { CurrentUserId } from 'src/common/decorators/get-user.decorator';
import { AdminJwtAccessGuard } from '../auth/guard/admin-access-jwt.guard';
import { NotificationService } from './notification.service';

@Controller('admin/notifications')
@UseGuards(AdminJwtAccessGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(@CurrentUserId() userId: string, @Query('isRead') isRead?: string) {
    const isReadBool = isRead === 'true' ? true : isRead === 'false' ? false : undefined;
    return this.notificationService.findAllForUser(userId, { isRead: isReadBool });
  }

  @Patch(':id/read')
  read(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.notificationService.markAsRead(id, userId);
  }

  @Patch('read-all')
  readAll(@CurrentUserId() userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }
}
