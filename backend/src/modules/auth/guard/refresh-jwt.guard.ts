import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard dành cho endpoint refresh token:
 * @UseGuards(JwtRefreshGuard)
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
