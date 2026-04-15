import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

/**
 * Refresh Token Strategy
 * Supports Hybrid Extraction:
 * 1. Authorization: Bearer <token>
 * 2. Cookie: refreshToken
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: (req: any) => {
        return req?.cookies?.['refreshToken'] || null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET')!,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const refreshToken =
      req?.cookies?.refreshToken || req?.get('Authorization')?.replace('Bearer ', '');

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
