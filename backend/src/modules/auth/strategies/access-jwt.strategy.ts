import type { JwtAccessPayload, RequestUserPayload } from '@common/types/jwt.types';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * JWT access strategy.
 * Designed for hybrid RBAC/ABAC:
 * - RBAC: Roles are stored in the JWT payload.
 * - ABAC: Permissions can be lazy-loaded from the DB when needed.
 *
 * Flow:
 * 1. Extract JWT from Authorization header or cookie.
 * 2. Validate token type is 'access'.
 * 3. Verify user exists and is active.
 * 4. Extract roles from JWT payload.
 * 5. Return RequestUserPayload with roles.
 */
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    /**
     * Retrieve and validate the JWT secret from configuration.
     */
    const secret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not defined!');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => req?.cookies?.['accessToken'] || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Validates JWT payload and returns the user context.
   *
   * @param payload - Decoded JWT payload.
   * @returns The user context attached to the request.
   *
   * Design decisions:
   * - Roles are extracted from the JWT payload (RBAC) to optimize performance.
   * - Permissions are lazy-loaded when required instead of being stored in the token.
   * - User validation queries the database to ensure the account is active.
   */
  async validate(payload: JwtAccessPayload): Promise<RequestUserPayload> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

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

    // Extract roles encoded in the JWT payload for RBAC
    const roles = payload.roles || [];

    /**
     * Returned payload is attached to req.user.
     * Permissions are omitted to minimize token size and allow dynamic checks.
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
