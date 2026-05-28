import { Injectable, Logger, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { RequestUserPayload } from '../types/jwt.types';

@Injectable()
export class BullBoardAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(BullBoardAuthMiddleware.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = this.extractTokenFromHeaderOrCookie(req);

    if (!token) {
      this.logger.warn(`BullBoard unauthorized access attempt from IP: ${req.ip}`);
      throw new UnauthorizedException('Admin Access Token Required');
    }

    try {
      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
      const payload = await this.jwtService.verifyAsync<RequestUserPayload>(token, { secret });

      // Enforce internal queue-dashboard access constraints.
      if (payload.aud !== 'admin' || payload.userType === 'CUSTOMER') {
        this.logger.warn(`Forbidden BullBoard structural access from user: ${payload.userId}`);
        throw new UnauthorizedException('Only backoffice staff can access queues');
      }

      req.user = payload;
      next();
    } catch (error) {
      this.logger.error(`BullBoard token verification failed`, error);
      throw new UnauthorizedException('Invalid Admin Token');
    }
  }

  private extractTokenFromHeaderOrCookie(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer') return token;

    if (request.cookies && request.cookies['accessToken']) {
      return request.cookies['accessToken'];
    }
    return undefined;
  }
}
