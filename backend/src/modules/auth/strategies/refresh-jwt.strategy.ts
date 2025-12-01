import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

/**
 * Refresh Token Strategy
 * - Lấy refresh token từ Cookie HttpOnly (OWASP khuyến nghị)
 * - Kiểm tra token type === 'refresh'
 * - Kiểm tra token hợp lệ & user active
 * - So sánh refresh token với hash trong database
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const secret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined!');
    }
    super({
      jwtFromRequest: ExtractJwtFromCookie,
      secretOrKey: secret,
      ignoreExpiration: false,
      passReqToCallback: true,
    } as any); // Type assertion cần thiết khi dùng passReqToCallback với passport-jwt
  }

  async validate(req: Request, payload: any) {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    // Kiểm tra refresh token với DB (hash)
    const user = await this.authService.validateRefreshToken(payload.sub, refreshToken);

    if (!user) throw new UnauthorizedException('Invalid refresh token');

    return {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      refreshToken,
    };
  }
}

/**
 * Hàm extract Refresh Token từ cookie
 */
function ExtractJwtFromCookie(req: Request): string | null {
  return req?.cookies?.refresh_token ?? null;
}
