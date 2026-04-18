import { ChangePasswordDto } from '@modules/auth/dto/change-password.dto';
import { ForgotPasswordDto } from '@modules/auth/dto/forgot-password.dto';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { RefreshTokenDto } from '@modules/auth/dto/refresh-token.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { ResetPasswordDto } from '@modules/auth/dto/reset-password.dto';
import { sanitizeUser } from '@modules/auth/sanitize/user.sanitize';
import { ForgotPassEmailService } from '@modules/auth/services/forgot-pass-email.auth.service';
import { VerifyEmailService } from '@modules/auth/services/verify-email.auth.service';
import { RiskScoreService } from '@modules/auth/services/risk-score.service';
import { SecurityEventBus, SecurityEventType } from '@modules/security/security-event-bus.service';
import { PrincipalType } from 'src/common/types/principal.types';
import { UserService } from '@modules/user/user.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthResponse } from '@shared';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { PrismaService } from 'src/prisma/prisma.service';

const ARGON_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  timeCost: 2,
  memoryCost: 19456,
  parallelism: 1,
};

const TOKEN_EXPIRY = {
  ACCESS: '15m',
  REFRESH: '7d',
  REFRESH_DB_MS: 7 * 24 * 60 * 60 * 1000,
};

const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'admin',
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly verifyEmailService: VerifyEmailService,
    private readonly forgotPassEmailService: ForgotPassEmailService,
    private readonly riskScoreService: RiskScoreService,
    private readonly eventBus: SecurityEventBus,
  ) { }

  // ---------------------------
  // PUBLIC API
  // ---------------------------

  async register(dto: RegisterDto, reqIp?: string, reqUa?: string): Promise<AuthResponse> {
    const exists = await this.prismaService.user.count({ where: { email: dto.email } });
    if (exists > 0) throw new BadRequestException('Email already exists');

    const passwordHash = await this.hashPassword(dto.password!);

    const user = await this.prismaService.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
      },
    });

    try {
      await this.verifyEmailService.sendVerifyEmail(
        {
          id: user.id,
          email: user.email,
          fullName: user.fullName ?? user.email,
        },
        reqIp,
        reqUa,
      );
    } catch (error) {
      this.logger.error(`Failed to trigger verify email for ${user.email}`, error);
      // NOTE: We no longer delete the user here in L8 flow.
      // The email is either queued in Outbox or the user can click "Resend".
    }

    const { tokens } = await this.issueTokenPair(user.id);

    return {
      user: sanitizeUser(user),
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    return this.handleLogin(dto, USER_ROLES.CUSTOMER);
  }

  async loginAdmin(dto: LoginDto): Promise<AuthResponse> {
    return this.handleLogin(dto, USER_ROLES.ADMIN);
  }

  /**
   * Unified login handler for both Customers and Admins
   */
  private async handleLogin(dto: LoginDto, requiredRole: string): Promise<AuthResponse> {
    const user = await this.prismaService.user.findFirst({
      where: dto.email ? { email: dto.email } : { phone: dto.phone },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await this.verifyPassword(user.passwordHash, dto.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // L8 Security: Enforce Email Verification
    if (!user.isEmailVerified) {
      throw new ForbiddenException('UNVERIFIED_EMAIL');
    }

    // Role Validation
    if (requiredRole === USER_ROLES.CUSTOMER) {
      const isCustomer = !(user as any).userType || (user as any).userType === 'CUSTOMER';
      if (!isCustomer) throw new UnauthorizedException('Invalid account type for this portal');
    } else if (requiredRole === USER_ROLES.ADMIN) {
      const isCustomer = !(user as any).userType || (user as any).userType === 'CUSTOMER';
      if (isCustomer) throw new UnauthorizedException('Access denied');
    }

    return await this.issueTokenPair(user.id, requiredRole === USER_ROLES.ADMIN ? 'admin' : 'customer');
  }

  // ---------------------------
  // PROFILE / ME
  // ---------------------------
  async getMe(userId: string): Promise<any> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return sanitizeUser(user);
  }

  async updateMe(
    userId: string,
    dto: import('@modules/auth/dto/update-me.dto').UpdateMeDto,
  ): Promise<any> {
    const user = await this.prismaService.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    // Check unique email if changed
    if (dto.email && dto.email !== user.email) {
      const exists = await this.prismaService.user.findUnique({ where: { email: dto.email } });
      if (exists) throw new BadRequestException('Email already in use');
    }

    // Check unique phone if changed
    if (dto.phone && dto.phone !== user.phone) {
      const exists = await this.prismaService.user.findUnique({ where: { phone: dto.phone } });
      if (exists) throw new BadRequestException('Phone number already in use');
    }

    const updated = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName ?? user.fullName,
        phone: dto.phone ?? user.phone,
        email: dto.email ?? user.email,
        updatedAt: new Date(),
      },
    });

    return sanitizeUser(updated);
  }

  // ---------------------------
  // REFRESH TOKEN (Atomic Rotation - Principal Grade)
  // ---------------------------
  async refreshToken(dto: RefreshTokenDto, reqIp?: string, reqUa?: string): Promise<AuthResponse> {
    if (!dto.refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const jti = (payload as any).jti;

    if (!jti) {
      throw new ForbiddenException('Invalid refresh token: missing jti');
    }

    const tokenRecord = await this.prismaService.refreshToken.findUnique({
      where: { id: jti },
    });

    if (!tokenRecord || !(await this.verifyPassword(tokenRecord.token, dto.refreshToken))) {
      throw new ForbiddenException('Invalid refresh token');
    }

    // 1. ATOMIC REUSE DETECTION (PANIC / GRACE WINDOW)
    if (tokenRecord.revokedAt) {
      const gracePeriodMs = 5000;
      const tRecord = tokenRecord as any;
      const timeSinceRevocation = Date.now() - tRecord.revokedAt.getTime();
      const isWithinGrace = timeSinceRevocation < gracePeriodMs;

      // Identity check for grace window: Must be same IP
      if (isWithinGrace && (tokenRecord as any).ipAddress === reqIp) {
        this.logger.debug(`Race condition grace hit for JTI ${jti}. IP: ${reqIp}. Skipping panic.`);
        // Note: For now we throw a special error the client can handle or retry.
        throw new ForbiddenException('RETRY_DETECTED: Rotation already in progress.');
      }

      const pToken = tokenRecord as any;
      this.eventBus.emit(SecurityEventType.TOKEN_REPLAY, { id: tokenRecord.userId, type: PrincipalType.USER }, { jti, reason: pToken.revokedReason });
      this.logger.error(`REUSE DETECTED! JTI: ${jti}, User: ${tokenRecord.userId}. Revoke Reason: ${pToken.revokedReason}`);

      // Response: Critical Mitigation - Invalidate ALL user sessions
      await this.prismaService.refreshToken.updateMany({
        where: { userId: tokenRecord.userId },
        data: {
          revokedAt: new Date(),
          revokedReason: 'GLOBAL_PANIC_REUSE_DETECTED'
        }
      });

      throw new ForbiddenException('Security compromise detected. All sessions revoked.');
    }

    // 2. EXPIRY CHECK
    if (tokenRecord.expiresAt < new Date()) {
      await this.prismaService.refreshToken.update({
        where: { id: jti },
        data: { revokedAt: new Date(), revokedReason: 'EXPIRED' }
      });
      throw new ForbiddenException('Refresh token expired');
    }

    // 3. ATOMIC SUCCESSFUL ROTATION
    const audience = (payload as any).aud === 'admin' ? 'admin' : 'customer';

    // Mark as revoked (used) to prevent reuse, but keep the record for forensic chain tracing
    await this.prismaService.refreshToken.update({
      where: { id: jti },
      data: {
        revokedAt: new Date(),
        revokedReason: 'ROTATED'
      }
    });

    return this.issueTokenPair(
      payload.sub,
      audience,
      jti, // parentJti
      tokenRecord.version + 1,
      reqIp,
      reqUa
    );
  }

  async logout(dto: import('@modules/auth/dto/logout.dto').LogoutDto) {
    try {
      const payload = (await this.jwtService.decode(dto.refreshToken)) as any;
      const jti = payload?.jti;
      if (!jti) return { message: 'Logged out successfully' };

      await this.prismaService.refreshToken.delete({ where: { id: jti } }).catch(() => {
        // Ignore if already deleted
      });
    } catch (e) {
      this.logger.warn(`Logout failed mostly due to invalid token format: ${e.message}`);
    }
    return { message: 'Logged out successfully' };
  }

  // ---------------------------
  // HELPERS
  // ---------------------------

  public async issueTokenPair(
    userId: string,
    audience: 'customer' | 'admin' = 'customer',
    parentJti?: string,
    version = 1,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const roles = user.userRoles.map((ur) => ur.role.slug);

    const jti = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ sub: userId, type: 'access', aud: audience, roles }, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES') || TOKEN_EXPIRY.ACCESS,
      } as any),
      this.jwtService.signAsync({ sub: userId, type: 'refresh', aud: audience, jti }, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES') || TOKEN_EXPIRY.REFRESH,
      } as any),
    ]);

    await this.saveRefreshToken({
      userId,
      jti,
      rawToken: refreshToken,
      parentJti,
      version,
      ipAddress,
      userAgent
    });

    return {
      user: sanitizeUser(user),
      tokens: { accessToken, refreshToken },
    };
  }

  private async saveRefreshToken(params: {
    userId: string;
    jti: string;
    rawToken: string;
    parentJti?: string;
    version?: number;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const tokenHash = await this.hashPassword(params.rawToken);
    await this.prismaService.refreshToken.create({
      data: {
        id: params.jti,
        userId: params.userId,
        token: tokenHash,
        parentJti: params.parentJti,
        version: params.version ?? 1,
        ipAddress: params.ipAddress,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY.REFRESH_DB_MS),
      },
    });
  }

  private async verifyRefreshToken(token: string) {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new ForbiddenException('Invalid refresh token');
    }
  }

  private async hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, ARGON_OPTIONS);
  }

  private async verifyPassword(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }

  /**
   * Validate refresh token với database
   * - Kiểm tra user tồn tại và active
   * - Kiểm tra refresh token hash trong DB (khi có RefreshToken model)
   * @param userId User ID từ JWT payload
   * @param refreshToken Raw refresh token từ cookie (sẽ dùng khi có RefreshToken model)
   * @returns User nếu hợp lệ, null nếu không
   */
  async validateRefreshToken(userId: string, refreshToken: string) {
    // Kiểm tra user tồn tại và active
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const tokenRecord = await this.prismaService.refreshToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!tokenRecord) {
      return null;
    }

    // Verify token hash
    const isValid = await this.verifyPassword(tokenRecord.token, refreshToken);
    if (!isValid) return null;

    // Check if token expired
    if (tokenRecord.expiresAt < new Date()) return null;

    // Trả về user với roles
    return {
      id: user.id,
      email: user.email,
      roles: user.userRoles.map((ur) => ur.role.name),
    };
  }

  // ---------------------------
  // FORGOT PASSWORD
  // ---------------------------
  async forgotPassword(dto: ForgotPasswordDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email hoặc phone là bắt buộc');
    }

    const user = await this.prismaService.user.findFirst({
      where: dto.email ? { email: dto.email } : { phone: dto.phone },
    });

    if (!user || !user.email || !user.isEmailVerified) {
      throw new BadRequestException(
        'Thông tin xác thực không hợp lệ hoặc tài khoản chưa được xác nhận',
      );
    }

    await this.forgotPassEmailService.sendForgotPasswordEmail(user.id, user.email, user.fullName);

    return { message: 'Nếu tài khoản tồn tại, chúng tôi đã gửi email hướng dẫn đặt lại mật khẩu.' };
  }

  async verifyResetToken(token: string) {
    const tokenRecord = await this.prismaService.resetPasswordToken.findFirst({
      where: { token },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Liên kết không hợp lệ hoặc đã hết hạn (Token not found)');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new BadRequestException('Liên kết đã hết hạn (Token expired)');
    }

    const { user } = tokenRecord;
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    // Security: Mask email (PII) to prevent leakage
    const [userPart, domainPart] = user.email.split('@');
    const maskedEmail =
      userPart.length > 2
        ? `${userPart[0]}${'*'.repeat(userPart.length - 2)}${userPart[userPart.length - 1]}@${domainPart}`
        : `${userPart[0]}***@${domainPart}`;

    return {
      valid: true,
      email: maskedEmail,
      name: user.fullName,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const tokenRecord = await this.prismaService.resetPasswordToken.findFirst({
      where: { token: dto.token },
    });

    if (!tokenRecord) throw new BadRequestException('Invalid or expired token');

    if (tokenRecord.expiresAt < new Date()) {
      await this.prismaService.resetPasswordToken.delete({ where: { id: tokenRecord.id } });
      throw new BadRequestException('Token expired, please request a new one');
    }

    const user = await this.prismaService.user.findUnique({ where: { id: tokenRecord.userId } });
    if (!user) throw new BadRequestException('User not found');

    const newPasswordHash = await this.hashPassword(dto.newPassword);

    await this.prismaService.$transaction([
      this.prismaService.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      }),
      this.prismaService.resetPasswordToken.delete({ where: { id: tokenRecord.id } }),
      this.prismaService.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);

    return { message: 'Password has been reset successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prismaService.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const isMatch = await this.verifyPassword(user.passwordHash!, dto.currentPassword);
    if (!isMatch) throw new BadRequestException('Incorrect current password');

    const newPasswordHash = await this.hashPassword(dto.newPassword);

    await this.prismaService.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all sessions/refresh tokens
    await this.prismaService.refreshToken.deleteMany({ where: { userId } });

    return { message: 'Password changed successfully' };
  }
}
