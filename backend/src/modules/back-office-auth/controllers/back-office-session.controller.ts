import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserType } from '@prisma/client';
import { SkipJwtAuth } from 'src/common/decorators/skip-jwt-auth.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { BackOfficeAuthGuard } from '../guards/back-office-auth.guard';
import { BackOfficeSessionService } from '../services/back-office-session.service';

@Controller('back-office/sessions')
export class BackOfficeSessionController {
  constructor(
    private readonly sessionService: BackOfficeSessionService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @SkipJwtAuth()
  @UseGuards(BackOfficeAuthGuard)
  async getActiveSessions(@Req() req: any) {
    const sessions = await this.sessionService.getActiveSessionsForUser(req.user.id);
    return sessions.map((sess) => ({
      id: sess.id,
      ipAddress: sess.ipAddress,
      userAgent: sess.userAgent,
      createdAt: sess.createdAt,
      lastUsedAt: sess.lastUsedAt,
      expiresAt: sess.expiresAt,
    }));
  }

  @Delete(':id')
  @SkipJwtAuth()
  @UseGuards(BackOfficeAuthGuard)
  async revokeSession(@Param('id') sessionId: string, @Req() req: any) {
    const session = await this.prisma.backOfficeSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên làm việc.');
    }

    // Owner check: can revoke own session
    // Admin check: super admin or has user update permission can revoke anyone's
    const isOwner = session.userId === req.user.id;
    const isSuperAdmin = req.user.userType === UserType.SUPER_ADMIN;

    if (!isOwner && !isSuperAdmin) {
      throw new ForbiddenException('Bạn không có quyền thu hồi phiên làm việc này.');
    }

    await this.sessionService.revokeSession(sessionId, req.user.id);
    return { success: true, message: 'Thu hồi phiên làm việc thành công.' };
  }

  @Delete('staff/:staffId')
  @SkipJwtAuth()
  @UseGuards(BackOfficeAuthGuard, PermissionGuard)
  @Permission('auth.user.update')
  async revokeAllStaffSessions(@Param('staffId') staffId: string, @Req() req: any) {
    const actorUserId = req.user.id;
    await this.sessionService.revokeAllSessionsForUser(staffId, actorUserId);
    return { success: true, message: 'Thu hồi toàn bộ phiên làm việc của nhân viên thành công.' };
  }
}
