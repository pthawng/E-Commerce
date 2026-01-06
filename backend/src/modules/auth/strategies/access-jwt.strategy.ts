import type { JwtAccessPayload, RequestUserPayload } from '@common/types/jwt.types';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * JWT Access Strategy
 *
 * Thiết kế cho Hybrid RBAC/ABAC:
 * - RBAC: Roles được lưu trong JWT payload (sub, roles, iat, exp)
 * - ABAC: Permissions có thể được lazy load từ DB khi cần (dynamic hơn)
 *
 * Flow:
 * 1. Extract JWT từ Authorization header
 * 2. Validate token type === 'access'
 * 3. Verify user tồn tại và active
 * 4. Extract roles từ JWT payload (không cần query DB - performance)
 * 5. Trả về RequestUserPayload với roles (permissions có thể lazy load sau)
 */
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    /**
     * Lấy SECRET từ config và kiểm tra.
     * Không dùng process.env trực tiếp để tránh anti-pattern.
     */
    const secret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not defined!');
    }
    /**
     * Gọi super() để cấu hình Passport JWT Strategy.
     * jwtFromRequest: Lấy token từ header Authorization: Bearer <token>
     * secretOrKey: SECRET để giải mã token
     * ignoreExpiration: false, bắt buộc phải hết hạn
     */
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
    });
  }

  /**
   * Validate JWT payload và trả về user context
   *
   * @param payload - JWT payload đã được decode (sub, type, roles, iat, exp)
   * @returns RequestUserPayload - Thông tin user để gắn vào req.user
   *
   * Design decisions:
   * - Roles được lấy từ JWT payload (RBAC) - không query DB để tối ưu performance
   * - Permissions không lưu trong JWT vì có thể thay đổi thường xuyên (ABAC)
   * - Permissions sẽ được lazy load trong PermissionGuard khi cần check
   * - User validation vẫn cần query DB để đảm bảo user còn active
   */
  async validate(payload: JwtAccessPayload): Promise<RequestUserPayload> {
    // Validate token type
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Validate user tồn tại và active
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        isActive: true,
        userType: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    // Extract roles từ JWT payload (RBAC)
    // Roles đã được encode trong token khi login/refresh
    const roles = payload.roles || [];

    /**
     * Giá trị trả về của validate() sẽ được gắn vào req.user
     * và có thể dùng tại Controller thông qua:
     *
     * @Req() req => req.user
     * hoặc
     * @CurrentUser() decorator custom
     *
     * Note: Permissions không được trả về ở đây vì:
     * - Permissions có thể thay đổi thường xuyên (ABAC)
     * - Sẽ được lazy load trong PermissionGuard khi cần check
     * - Giảm kích thước JWT và tăng performance
     */
    return {
      userId: payload.sub,
      email: user.email,
      roles,
      aud: payload.aud,
      userType: user.userType,
    };
  }
}
