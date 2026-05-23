import { Injectable, Logger } from '@nestjs/common';
import { NotificationPriority, NotificationType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';

export interface CreateNotificationDto {
  userId?: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  content: string;
  metadata?: any;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
  ) {}

  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        priority: dto.priority,
        title: dto.title,
        content: dto.content,
        metadata: dto.metadata || {},
      },
    });

    // Push to WebSockets
    if (dto.userId) {
      this.gateway.sendToUser(dto.userId, 'notification', notification);
    } else {
      this.gateway.sendToAll('notification', notification);
    }

    return notification;
  }

  async findAllForUser(userId: string, query: { isRead?: boolean; limit?: number } = {}) {
    return this.prisma.notification.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
        isRead: query.isRead,
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit || 50,
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
