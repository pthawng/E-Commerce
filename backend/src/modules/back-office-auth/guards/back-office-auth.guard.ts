import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { StaffStatus } from '@prisma/client';
import { BackOfficeSessionService } from '../services/back-office-session.service';

@Injectable()
export class BackOfficeAuthGuard implements CanActivate {
  constructor(private readonly sessionService: BackOfficeSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = request.cookies ? request.cookies['backOfficeSessionId'] : undefined;

    if (!sessionId) {
      throw new UnauthorizedException('Quyền truy cập yêu cầu đăng nhập back-office.');
    }

    const session = await this.sessionService.verifySession(sessionId);
    if (!session) {
      throw new UnauthorizedException('Phiên làm việc back-office đã hết hạn hoặc không hợp lệ.');
    }

    const { user } = session;

    // Check user active status
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa.');
    }

    // Check staff status
    if (!user.staffProfile) {
      throw new ForbiddenException('Tài khoản này không có hồ sơ quản trị.');
    }

    const { staffStatus, mfaEnabled } = user.staffProfile;
    if (staffStatus === StaffStatus.SUSPENDED || staffStatus === StaffStatus.DISABLED) {
      throw new ForbiddenException('Quyền truy cập quản trị của bạn đã bị vô hiệu hóa.');
    }

    // Enforce that MFA is enabled and verified
    if (!mfaEnabled || staffStatus !== StaffStatus.ACTIVE) {
      throw new ForbiddenException('Yêu cầu hoàn tất xác thực 2 lớp (MFA) trước khi truy cập.');
    }

    // Check roles/type eligibility
    const hasStaffRoles = user.userRoles && user.userRoles.length > 0;

    if (!hasStaffRoles) {
      throw new ForbiddenException('Tài khoản không có quyền truy cập back-office.');
    }

    // Set request.user so that other guards (like PermissionGuard) can access it
    // Align request.user shape so that user.userId is available
    request.user = {
      ...user,
      userId: user.id, // For PermissionGuard compatibility
    };

    return true;
  }
}
