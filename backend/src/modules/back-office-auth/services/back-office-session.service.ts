import { SystemSettingService } from '@modules/system/system-setting.service';
import { Injectable } from '@nestjs/common';
import { BackOfficeSession } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { BackOfficeAuditLogService } from './back-office-audit-log.service';

@Injectable()
export class BackOfficeSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: BackOfficeAuditLogService,
    private readonly settings: SystemSettingService,
  ) {}

  async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<BackOfficeSession> {
    const ttlHours = await this.settings.getNumber('auth.session.backOfficeTtlHours');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    const session = await this.prisma.backOfficeSession.create({
      data: {
        userId,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    await this.auditLogService.log({
      actorUserId: userId,
      action: 'SESSION_CREATE',
      resource: 'BackOfficeSession',
      resourceId: session.id,
      ipAddress,
      userAgent,
    });

    return session;
  }

  async verifySession(sessionId: string): Promise<any> {
    const session = await this.prisma.backOfficeSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: {
            staffProfile: true,
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!session) return null;

    const now = new Date();
    if (session.revokedAt || session.expiresAt < now) {
      return null;
    }

    // Update lastUsedAt in the background (or block, it's fast)
    await this.prisma.backOfficeSession.update({
      where: { id: sessionId },
      data: { lastUsedAt: now },
    });

    return session;
  }

  async revokeSession(sessionId: string, actorUserId: string): Promise<void> {
    const session = await this.prisma.backOfficeSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.revokedAt) return;

    await this.prisma.backOfficeSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    await this.auditLogService.log({
      actorUserId,
      targetUserId: session.userId,
      action: 'SESSION_REVOKE',
      resource: 'BackOfficeSession',
      resourceId: sessionId,
    });
  }

  async revokeAllSessionsForUser(userId: string, actorUserId: string): Promise<void> {
    const now = new Date();

    const activeSessions = await this.prisma.backOfficeSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
    });

    if (activeSessions.length === 0) return;

    await this.prisma.backOfficeSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { revokedAt: now },
    });

    for (const session of activeSessions) {
      await this.auditLogService.log({
        actorUserId,
        targetUserId: userId,
        action: 'SESSION_REVOKE_ALL',
        resource: 'BackOfficeSession',
        resourceId: session.id,
      });
    }
  }

  async getActiveSessionsForUser(userId: string): Promise<BackOfficeSession[]> {
    const now = new Date();
    return this.prisma.backOfficeSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { lastUsedAt: 'desc' },
    });
  }
}
