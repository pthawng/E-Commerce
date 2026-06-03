import { MailService } from '@modules/mail/mail.service';
import { SystemSettingService } from '@modules/system/system-setting.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StaffInvitation, StaffInvitationStatus, StaffStatus, UserType } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { BackOfficeAuditLogService } from './back-office-audit-log.service';

const ARGON_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  timeCost: 2,
  memoryCost: 19456,
  parallelism: 1,
};

@Injectable()
export class BackOfficeStaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly auditLogService: BackOfficeAuditLogService,
    private readonly settings: SystemSettingService,
  ) {}

  async inviteStaff(
    dto: { email: string; roleSlugs: string[]; department?: string },
    actorUserId: string,
  ): Promise<StaffInvitation> {
    const email = dto.email.trim().toLowerCase();

    // Check if there is an active pending invitation
    const pendingInvitation = await this.prisma.staffInvitation.findFirst({
      where: {
        email,
        status: StaffInvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (pendingInvitation) {
      throw new ConflictException(
        'Tài khoản đã có một lời mời chưa hết hạn. Vui lòng thu hồi hoặc đợi hết hạn.',
      );
    }

    // Resolve roles
    const roles = await this.prisma.role.findMany({
      where: {
        slug: { in: dto.roleSlugs },
      },
    });

    if (roles.length !== dto.roleSlugs.length) {
      throw new NotFoundException('Một hoặc nhiều vai trò được chọn không tồn tại.');
    }

    // Find or create User
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { staffProfile: true },
    });

    await this.prisma.$transaction(async (tx) => {
      if (!user) {
        // Case 1: New user
        user = await tx.user.create({
          data: {
            email,
            fullName: email.split('@')[0], // Default name
            userType: UserType.STAFF,
            isActive: true,
          },
          include: { staffProfile: true },
        });
      }

      if (!user) {
        throw new BadRequestException('Không thể khởi tạo hoặc xác định tài khoản.');
      }
      const activeUser = user;

      // Create staff profile if not exists
      if (
        activeUser.staffProfile &&
        activeUser.staffProfile.staffStatus !== StaffStatus.MFA_SETUP_REQUIRED
      ) {
        throw new ConflictException(
          'TÃ i khoáº£n nÃ y Ä‘Ã£ cÃ³ há»“ sÆ¡ nhÃ¢n sá»±. Vui lÃ²ng cáº­p nháº­t vai trÃ² hoáº·c tráº¡ng thÃ¡i thay vÃ¬ gá»­i láº¡i lá»i má»i.',
        );
      }

      if (!activeUser.staffProfile) {
        await tx.staffProfile.create({
          data: {
            userId: activeUser.id,
            staffStatus: StaffStatus.MFA_SETUP_REQUIRED,
            mfaEnabled: false,
            department: dto.department,
            invitedBy: actorUserId,
          },
        });
      } else {
        await tx.staffProfile.update({
          where: { userId: activeUser.id },
          data: {
            department: dto.department,
          },
        });
      }

      // Sync roles: delete current user roles, then add new ones
      await tx.userRole.deleteMany({
        where: { userId: activeUser.id },
      });

      await tx.userRole.createMany({
        data: roles.map((role) => ({
          userId: activeUser.id,
          roleId: role.id,
          assignedBy: actorUserId,
        })),
      });
    });

    if (!user) {
      throw new BadRequestException('Không thể khởi tạo tài khoản nhân sự.');
    }

    // Generate secure invitation token
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiryHours = await this.settings.getNumber('auth.invitation.expiryHours');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    const invitation = await this.prisma.staffInvitation.create({
      data: {
        email,
        tokenHash,
        status: StaffInvitationStatus.PENDING,
        expiresAt,
      },
    });

    // Audit log
    await this.auditLogService.log({
      actorUserId,
      targetUserId: user.id,
      action: 'STAFF_INVITE',
      resource: 'StaffInvitation',
      resourceId: invitation.id,
      newValue: JSON.stringify({ email, roles: dto.roleSlugs }),
    });

    // Send invitation email
    const backofficeUrl =
      this.configService.get<string>('BACKOFFICE_URL') || 'http://localhost:8081';
    const invitationUrl = `${backofficeUrl}/back-office/accept-invitation?token=${rawToken}`;

    await this.mailService.sendMail({
      to: email,
      subject: '[Ray Paradis] Lời mời tham gia Ban Quản Trị',
      template: 'staff-invitation',
      context: {
        companyName: 'Ray Paradis',
        invitationUrl,
        expiryHours,
      },
    });

    return invitation;
  }

  async verifyInvitation(token: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const invitation = await this.prisma.staffInvitation.findUnique({
      where: { tokenHash },
    });

    if (!invitation) {
      throw new NotFoundException('Liên kết mời không tồn tại hoặc không hợp lệ.');
    }

    if (invitation.status !== StaffInvitationStatus.PENDING) {
      throw new BadRequestException('Lời mời đã được sử dụng hoặc bị thu hồi.');
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.staffInvitation.update({
        where: { id: invitation.id },
        data: { status: StaffInvitationStatus.EXPIRED },
      });
      throw new BadRequestException('Lời mời đã hết hạn.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: invitation.email },
      include: {
        staffProfile: true,
        oauthAccounts: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản tương ứng với lời mời.');
    }

    return { invitation, user };
  }

  async revokeInvitation(invitationId: string, actorUserId: string): Promise<void> {
    const invitation = await this.prisma.staffInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Không tìm thấy lời mời.');
    }

    if (invitation.status !== StaffInvitationStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể thu hồi lời mời ở trạng thái PENDING.');
    }

    await this.prisma.staffInvitation.update({
      where: { id: invitationId },
      data: { status: StaffInvitationStatus.REVOKED },
    });

    await this.auditLogService.log({
      actorUserId,
      action: 'STAFF_INVITE_REVOKE',
      resource: 'StaffInvitation',
      resourceId: invitationId,
    });
  }

  async listStaff() {
    return this.prisma.user.findMany({
      where: {
        staffProfile: {
          isNot: null,
        },
      },
      include: {
        staffProfile: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStaffStatus(
    staffId: string,
    status: StaffStatus,
    actorUserId: string,
  ): Promise<void> {
    const staff = await this.prisma.user.findUnique({
      where: { id: staffId },
      include: { staffProfile: true },
    });

    if (!staff || !staff.staffProfile) {
      throw new NotFoundException('Không tìm thấy nhân viên.');
    }

    const oldStatus = staff.staffProfile.staffStatus;

    await this.prisma.staffProfile.update({
      where: { userId: staffId },
      data: { staffStatus: status },
    });

    await this.auditLogService.log({
      actorUserId,
      targetUserId: staffId,
      action: 'STAFF_STATUS_UPDATE',
      resource: 'StaffProfile',
      resourceId: staff.staffProfile.id,
      oldValue: oldStatus,
      newValue: status,
    });
  }
}
