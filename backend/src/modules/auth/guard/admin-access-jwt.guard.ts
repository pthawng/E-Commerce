import type { RequestUserPayload } from '@common/types/jwt.types';
import { JwtAccessGuard } from '@modules/auth/guard/access-jwt.guard';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

/**
 * Guard dành riêng cho back-office:
 * - Yêu cầu token có aud = 'admin'
 * - Và userType != 'CUSTOMER'
 */
@Injectable()
export class AdminJwtAccessGuard extends JwtAccessGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const base = await super.canActivate(context);
    if (!base) return false;

    const req = context.switchToHttp().getRequest();
    const user = req.user as RequestUserPayload;

    if (user.aud && user.aud !== 'admin') {
      throw new UnauthorizedException('Admin access token required');
    }

    if (user.userType === 'CUSTOMER') {
      throw new UnauthorizedException('Customer token is not allowed for back-office');
    }

    return true;
  }
}
