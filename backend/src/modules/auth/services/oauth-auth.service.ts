import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthProvider, UserType } from '@prisma/client';
import axios from 'axios';
import type { Cache } from 'cache-manager';
import type { Response } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from '../auth.service';
import { setAuthCookies } from '../utils/auth-cookie.helper';

type SupportedOAuthProvider = 'google' | 'facebook';

type OAuthStatePayload = {
  provider: SupportedOAuthProvider;
  returnTo: string;
  codeVerifier: string;
  nonce: string;
};

type OAuthProfile = {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  avatarUrl?: string;
};

@Injectable()
export class OAuthAuthService {
  private readonly logger = new Logger(OAuthAuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async buildAuthorizationUrl(providerParam: string, returnToParam?: string): Promise<string> {
    const provider = this.normalizeProvider(providerParam);
    const state = this.randomToken();
    const codeVerifier = this.randomToken();
    const nonce = this.randomToken();
    const payload: OAuthStatePayload = {
      provider,
      returnTo: this.normalizeReturnTo(returnToParam),
      codeVerifier,
      nonce,
    };

    await this.cacheManager.set(
      this.stateKey(state),
      payload,
      this.configService.get<number>('OAUTH_STATE_TTL_SECONDS', 600) * 1000,
    );

    if (provider === 'google') {
      return this.buildGoogleAuthorizationUrl(state, codeVerifier, nonce);
    }

    return this.buildFacebookAuthorizationUrl(state);
  }

  async handleCallback(
    providerParam: string,
    query: Record<string, string | undefined>,
    req: any,
    res: Response,
  ): Promise<void> {
    const provider = this.normalizeProvider(providerParam);
    const state = query.state;
    const code = query.code;

    if (!state || !code) {
      this.redirectWithError(res, '/', 'oauth_invalid_callback');
      return;
    }

    const statePayload = await this.cacheManager.get<OAuthStatePayload>(this.stateKey(state));
    await this.cacheManager.del(this.stateKey(state));

    if (!statePayload || statePayload.provider !== provider) {
      this.redirectWithError(res, '/', 'oauth_state_invalid');
      return;
    }

    try {
      const profile =
        provider === 'google'
          ? await this.fetchGoogleProfile(code, statePayload.codeVerifier)
          : await this.fetchFacebookProfile(code);

      const user = await this.resolveCustomer(profile);

      const result = await this.authService.issueTokenPair(
        user.id,
        'customer',
        undefined,
        1,
        req.ip,
        req.headers['user-agent'],
      );

      setAuthCookies(req, res, result.tokens);

      this.logger.log(`OAuth login successful via ${provider} for user=${user.id}`);
      this.redirectWithStatus(res, statePayload.returnTo, 'success');
    } catch (error) {
      const code = this.toPublicErrorCode(error);
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `OAuth login failed via ${provider}: ${code} — ${detail}`,
        error instanceof Error ? error.stack : '',
      );
      this.redirectWithError(res, statePayload.returnTo, code);
    }
  }

  private async resolveCustomer(profile: OAuthProfile) {
    const existingAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { user: { include: this.userInclude } },
    });

    if (existingAccount) {
      if (!existingAccount.user.isActive || existingAccount.user.userType !== UserType.CUSTOMER) {
        throw new ForbiddenException('OAUTH_ACCESS_DENIED');
      }

      await this.prisma.$transaction([
        this.prisma.oAuthAccount.update({
          where: { id: existingAccount.id },
          data: {
            email: profile.email,
            emailVerified: profile.emailVerified,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            lastLoginAt: new Date(),
          },
        }),
        this.prisma.user.update({
          where: { id: existingAccount.userId },
          data: {
            lastLoginAt: new Date(),
            avatarUrl: existingAccount.user.avatarUrl || profile.avatarUrl,
          },
        }),
      ]);

      return existingAccount.user;
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
      include: this.userInclude,
    });

    if (existingUser) {
      if (!existingUser.isActive || existingUser.userType !== UserType.CUSTOMER) {
        throw new ForbiddenException('OAUTH_ACCESS_DENIED');
      }

      if (profile.provider !== OAuthProvider.GOOGLE || !profile.emailVerified) {
        throw new ForbiddenException('OAUTH_LINK_REQUIRED');
      }

      await this.prisma.$transaction([
        this.prisma.oAuthAccount.create({
          data: {
            userId: existingUser.id,
            ...this.oauthAccountData(profile),
          },
        }),
        this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            isEmailVerified: true,
            lastLoginAt: new Date(),
            avatarUrl: existingUser.avatarUrl || profile.avatarUrl,
          },
        }),
      ]);

      return existingUser;
    }

    const user = await this.prisma.user.create({
      data: {
        email: profile.email,
        fullName: profile.displayName || profile.email.split('@')[0],
        passwordHash: null,
        isEmailVerified: profile.emailVerified,
        avatarUrl: profile.avatarUrl,
        userType: UserType.CUSTOMER,
        lastLoginAt: new Date(),
        oauthAccounts: {
          create: this.oauthAccountData(profile),
        },
      },
      include: this.userInclude,
    });

    return user;
  }

  private oauthAccountData(profile: OAuthProfile) {
    return {
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
      email: profile.email,
      emailVerified: profile.emailVerified,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      lastLoginAt: new Date(),
    };
  }

  private buildGoogleAuthorizationUrl(state: string, codeVerifier: string, nonce: string): string {
    const clientId = this.requiredConfig('GOOGLE_OAUTH_CLIENT_ID');
    const redirectUri = this.callbackUrl('google');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      nonce,
      code_challenge: this.pkceChallenge(codeVerifier),
      code_challenge_method: 'S256',
      access_type: 'offline',
      prompt: 'select_account',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  private buildFacebookAuthorizationUrl(state: string): string {
    const clientId = this.requiredConfig('FACEBOOK_OAUTH_CLIENT_ID');
    const redirectUri = this.callbackUrl('facebook');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email,public_profile',
      state,
    });

    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  private async fetchGoogleProfile(code: string, codeVerifier: string): Promise<OAuthProfile> {
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id: this.requiredConfig('GOOGLE_OAUTH_CLIENT_ID'),
        client_secret: this.requiredConfig('GOOGLE_OAUTH_CLIENT_SECRET'),
        redirect_uri: this.callbackUrl('google'),
        grant_type: 'authorization_code',
        code,
        code_verifier: codeVerifier,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const userInfo = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
    });

    if (!userInfo.data.email) {
      throw new BadRequestException('OAUTH_EMAIL_REQUIRED');
    }

    return {
      provider: OAuthProvider.GOOGLE,
      providerAccountId: userInfo.data.sub,
      email: String(userInfo.data.email).toLowerCase(),
      emailVerified: userInfo.data.email_verified === true,
      displayName: userInfo.data.name || userInfo.data.email,
      avatarUrl: userInfo.data.picture,
    };
  }

  private async fetchFacebookProfile(code: string): Promise<OAuthProfile> {
    const tokenResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: this.requiredConfig('FACEBOOK_OAUTH_CLIENT_ID'),
        client_secret: this.requiredConfig('FACEBOOK_OAUTH_CLIENT_SECRET'),
        redirect_uri: this.callbackUrl('facebook'),
        code,
      },
    });

    const userInfo = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,email,picture.type(large)',
        access_token: tokenResponse.data.access_token,
      },
    });

    if (!userInfo.data.email) {
      throw new BadRequestException('OAUTH_EMAIL_REQUIRED');
    }

    return {
      provider: OAuthProvider.FACEBOOK,
      providerAccountId: userInfo.data.id,
      email: String(userInfo.data.email).toLowerCase(),
      emailVerified: false,
      displayName: userInfo.data.name || userInfo.data.email,
      avatarUrl: userInfo.data.picture?.data?.url,
    };
  }

  private normalizeProvider(provider: string): SupportedOAuthProvider {
    if (provider === 'google' || provider === 'facebook') return provider;
    throw new BadRequestException('Unsupported OAuth provider');
  }

  private normalizeReturnTo(returnTo?: string): string {
    if (!returnTo) return '/';
    if (!returnTo.startsWith('/') || returnTo.startsWith('//') || returnTo.includes('\\')) {
      return '/';
    }
    return returnTo;
  }

  private redirectWithStatus(res: Response, returnTo: string, status: string): void {
    const url = new URL(this.normalizeReturnTo(returnTo), this.frontendUrl());
    url.searchParams.set('oauth', status);
    res.redirect(url.toString());
  }

  private redirectWithError(res: Response, returnTo: string, errorCode: string): void {
    const url = new URL(this.normalizeReturnTo(returnTo), this.frontendUrl());
    url.searchParams.set('oauth_error', errorCode);
    res.redirect(url.toString());
  }

  private callbackUrl(provider: SupportedOAuthProvider): string {
    return `${this.configService.get<string>('BACKEND_PUBLIC_URL', 'http://localhost:4000').replace(/\/$/, '')}/api/auth/oauth/${provider}/callback`;
  }

  private frontendUrl(): string {
    return this.configService
      .get<string>('FRONTEND_URL', 'http://localhost:5173')
      .replace(/\/$/, '');
  }

  private requiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) throw new BadRequestException(`${key}_MISSING`);
    return value;
  }

  private randomToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private pkceChallenge(verifier: string): string {
    return createHash('sha256').update(verifier).digest('base64url');
  }

  private stateKey(state: string): string {
    return `oauth:state:${state}`;
  }

  private toPublicErrorCode(error: unknown): string {
    if (
      error instanceof ForbiddenException ||
      error instanceof BadRequestException ||
      error instanceof UnauthorizedException
    ) {
      const response = error.getResponse() as any;
      return typeof response === 'string'
        ? response.toLowerCase()
        : response?.message || 'oauth_failed';
    }

    return 'oauth_failed';
  }

  private get userInclude() {
    return {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
      userPermissions: {
        include: {
          permission: true,
        },
      },
    };
  }
}
