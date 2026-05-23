import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

/**
 * JWT refresh token strategy.
 * Extracts and validates refresh token from request headers, cookies, or body.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const secret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined!');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => req?.cookies?.['refreshToken'] || null,
        (req: any) => req?.body?.['refreshToken'] || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
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

    // Validate refresh token with database hash
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
