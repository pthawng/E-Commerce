import { PermissionCacheService } from '@modules/rbac/cache/permission-cache.service';
import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StaffInvitationStatus, StaffStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Public } from 'src/common/decorators/public.decorator';
import { SkipJwtAuth } from 'src/common/decorators/skip-jwt-auth.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { BackOfficeAuthGuard } from '../guards/back-office-auth.guard';
import { BackOfficeAuthService } from '../services/back-office-auth.service';
import { BackOfficeSessionService } from '../services/back-office-session.service';
import { BackOfficeStaffService } from '../services/back-office-staff.service';

const ARGON_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  timeCost: 2,
  memoryCost: 19456,
  parallelism: 1,
};

function assertStaffPasswordPolicy(password: string) {
  const strongEnough =
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  if (!strongEnough) {
    throw new BadRequestException(
      'Staff password must be at least 12 characters and include uppercase, lowercase, number, and symbol.',
    );
  }
}

class InviteStaffDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  roleSlugs: string[];

  @IsString()
  @IsOptional()
  department?: string;
}

class AcceptInvitationDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  googleIdToken?: string;
}

class UpdateStatusDto {
  @IsEnum(StaffStatus)
  @IsNotEmpty()
  status: StaffStatus;
}

class UpdateRolesDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  roleSlugs: string[];
}

@Controller('back-office/staff')
export class BackOfficeStaffController {
  constructor(
    private readonly staffService: BackOfficeStaffService,
    private readonly authService: BackOfficeAuthService,
    private readonly sessionService: BackOfficeSessionService,
    private readonly prisma: PrismaService,
    private readonly permissionCacheService: PermissionCacheService,
  ) {}

  @Post('invitations')
  @SkipJwtAuth()
  @UseGuards(BackOfficeAuthGuard, PermissionGuard)
  @Permission('auth.user.create')
  async invite(@Body() dto: InviteStaffDto, @Req() req: any) {
    const actorUserId = req.user.id;
    return this.staffService.inviteStaff(dto, actorUserId);
  }

  @Get('invitations/verify')
  @Public() // Public route for verification before accept
  async verifyInvitation(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Mã mời không được để trống.');
    }
    const { invitation, user } = await this.staffService.verifyInvitation(token);
    return {
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      hasPassword: !!user.passwordHash,
      hasGoogle: user.oauthAccounts.some((o) => o.provider === 'GOOGLE'),
    };
  }

  @Post('invitations/accept')
  @Public() // Public route to accept invitation
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(@Body() dto: AcceptInvitationDto) {
    const { invitation, user } = await this.staffService.verifyInvitation(dto.token);
    let identityVerified = false;

    if (dto.googleIdToken) {
      // Case 3 (or anyone accepting with Google): Verify Google Token
      const googlePayload = await this.authService.verifyGoogleIdToken(dto.googleIdToken);
      if (!googlePayload.email) {
        throw new BadRequestException('Không thể xác định email từ tài khoản Google.');
      }
      if (googlePayload.email.toLowerCase() !== invitation.email.toLowerCase()) {
        throw new BadRequestException('Email tài khoản Google không khớp với email được mời.');
      }

      identityVerified = true;

      // Link Google OAuth account if it does not exist
      const googleAccount = user.oauthAccounts.find((o) => o.provider === 'GOOGLE');
      if (!googleAccount) {
        await this.prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'GOOGLE',
            providerAccountId: googlePayload.sub,
            email: googlePayload.email.toLowerCase(),
            emailVerified: true,
            displayName: googlePayload.name,
            avatarUrl: googlePayload.picture,
          },
        });
      }
    }

    if (dto.password) {
      // Case 1 & 2: Verify or set password
      if (user.passwordHash) {
        // Case 2: Existing customer with password - verify their existing password
        const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
        identityVerified = true;
        if (!isPasswordValid) {
          throw new BadRequestException('Mật khẩu cũ không chính xác.');
        }
      } else {
        // Case 1: New user - set password
        assertStaffPasswordPolicy(dto.password);
        const passwordHash = await argon2.hash(dto.password, ARGON_OPTIONS);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { passwordHash, isEmailVerified: true },
        });
        identityVerified = true;
      }
    } else if (!identityVerified) {
      throw new BadRequestException('Cần cung cấp mật khẩu hoặc xác thực bằng Google.');
    }

    if (!user.passwordHash && !dto.password) {
      throw new BadRequestException(
        'Back-office password setup is required before MFA enrollment.',
      );
    }

    // Accept invitation
    await this.prisma.staffInvitation.update({
      where: { id: invitation.id },
      data: {
        status: StaffInvitationStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
    });

    // Generate temp token for MFA setup challenge
    const tempToken = await this.authService.generateMfaTempToken(user.id, 'mfa_setup');

    return {
      nextStep: 'MFA_SETUP_REQUIRED',
      tempToken,
    };
  }

  @Get()
  @SkipJwtAuth()
  @UseGuards(BackOfficeAuthGuard, PermissionGuard)
  @Permission('auth.user.read')
  async list() {
    const list = await this.staffService.listStaff();
    return list.map((staff) => ({
      id: staff.id,
      email: staff.email,
      fullName: staff.fullName,
      userType: staff.userType,
      isActive: staff.isActive,
      roles: staff.userRoles.map((ur) => ur.role.slug),
      staffProfile: staff.staffProfile
        ? {
            id: staff.staffProfile.id,
            staffStatus: staff.staffProfile.staffStatus,
            mfaEnabled: staff.staffProfile.mfaEnabled,
            department: staff.staffProfile.department,
            joinedAt: staff.staffProfile.joinedAt,
          }
        : null,
    }));
  }

  @Get('roles/available')
  @SkipJwtAuth()
  @UseGuards(BackOfficeAuthGuard, PermissionGuard)
  @Permission('auth.role.read')
  async availableRoles() {
    const roles = await this.prisma.role.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        isSystem: true,
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    return roles;
  }

  @Patch(':id/status')
  @SkipJwtAuth()
  @UseGuards(BackOfficeAuthGuard, PermissionGuard)
  @Permission('auth.user.update')
  async updateStatus(@Param('id') staffId: string, @Body() dto: UpdateStatusDto, @Req() req: any) {
    const actorUserId = req.user.id;
    await this.staffService.updateStaffStatus(staffId, dto.status, actorUserId);
    await this.permissionCacheService.clearCache(staffId);

    // If status is suspended or disabled, terminate sessions
    if (dto.status === StaffStatus.SUSPENDED || dto.status === StaffStatus.DISABLED) {
      await this.sessionService.revokeAllSessionsForUser(staffId, actorUserId);
    }

    return { success: true, message: 'Cập nhật trạng thái nhân viên thành công.' };
  }

  @Post(':id/roles')
  @SkipJwtAuth()
  @UseGuards(BackOfficeAuthGuard, PermissionGuard)
  @Permission('auth.user.assign-role')
  async updateRoles(@Param('id') staffId: string, @Body() dto: UpdateRolesDto, @Req() req: any) {
    const actorUserId = req.user.id;

    // Resolve roles
    const roles = await this.prisma.role.findMany({
      where: { slug: { in: dto.roleSlugs } },
    });

    if (roles.length !== dto.roleSlugs.length) {
      throw new BadRequestException('Một hoặc nhiều vai trò không tồn tại.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: { userId: staffId },
      });

      await tx.userRole.createMany({
        data: roles.map((role) => ({
          userId: staffId,
          roleId: role.id,
          assignedBy: actorUserId,
        })),
      });
    });

    await this.permissionCacheService.clearCache(staffId);

    // Invalidate active sessions to force re-auth with new roles
    await this.sessionService.revokeAllSessionsForUser(staffId, actorUserId);

    return { success: true, message: 'Cập nhật vai trò nhân viên thành công.' };
  }
}
