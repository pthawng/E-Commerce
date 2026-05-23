import { Public } from '@common/decorators/public.decorator';
import { Controller, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { OAuthAuthService } from '../services/oauth-auth.service';

@Public()
@Controller('auth/oauth')
@Throttle({ strict: { limit: 10, ttl: 60000 } })
@UseGuards(ThrottlerGuard)
export class OAuthAuthController {
  constructor(private readonly oauthAuthService: OAuthAuthService) {}

  @Get(':provider/start')
  async start(
    @Param('provider') provider: string,
    @Query('returnTo') returnTo: string | undefined,
    @Res() res: Response,
  ) {
    const authorizationUrl = await this.oauthAuthService.buildAuthorizationUrl(provider, returnTo);
    return res.redirect(authorizationUrl);
  }

  @Get(':provider/callback')
  async callback(
    @Param('provider') provider: string,
    @Query() query: Record<string, string | undefined>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.oauthAuthService.handleCallback(provider, query, req, res);
  }
}
