import { ChangePasswordDto } from '@modules/auth/dto/change-password.dto';
import { ForgotPasswordDto } from '@modules/auth/dto/forgot-password.dto';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { RefreshTokenDto } from '@modules/auth/dto/refresh-token.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { ResetPasswordDto } from '@modules/auth/dto/reset-password.dto';
import { sanitizeUser } from '@modules/auth/sanitize/user.sanitize';
import { ForgotPassEmailService } from '@modules/auth/services/forgot-pass-email.auth.service';
import { VerifyEmailService } from '@modules/auth/services/verify-email.auth.service';
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
import type { AuthResponse, AuthTokens } from '@shared';
import * as argon2 from 'argon2';
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
  REFRESH_DB_MS: 30 * 24 * 60 * 60 * 1000,
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
  ) { }

  // ---------------------------
  // PUBLIC API
  // ---------------------------

  async register(dto: RegisterDto): Promise<AuthResponse> {
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
      await this.verifyEmailService.sendVerifyEmail({
        id: user.id,
        email: user.email,
        fullName: user.fullName ?? user.email,
      });
    } catch (error) {
      this.logger.error(`Failed to send verify email to ${user.email}`, error);
      await this.prismaService.user.delete({ where: { id: user.id } });
      throw new BadRequestException('Unable to send verification email. Please try again.');
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

    // Role Validation
    if (requiredRole === USER_ROLES.CUSTOMER) {
      const isCustomer = !((user as any).userType) || (user as any).userType === 'CUSTOMER';
      if (!isCustomer) throw new UnauthorizedException('Invalid account type for this portal');
    } else if (requiredRole === USER_ROLES.ADMIN) {
      const isCustomer = !((user as any).userType) || (user as any).userType === 'CUSTOMER';
      if (isCustomer) throw new UnauthorizedException('Access denied');
    }

    return this.issueTokenPair(user.id, requiredRole === USER_ROLES.ADMIN ? 'admin' : 'customer');
  }

  // ---------------------------
  // REFRESH TOKEN
  // ---------------------------
  async refreshToken(dto: RefreshTokenDto): Promise<AuthResponse> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const tokenRecord = await this.prismaService.refreshToken.findFirst({
      where: { userId: payload.sub },
      orderBy: { createdAt: 'desc' },
    });

    if (!tokenRecord || !(await this.verifyPassword(tokenRecord.token, dto.refreshToken))) {
      throw new ForbiddenException('Invalid refresh token');
    }

    if (tokenRecord.expiresAt < new Date()) {
      await this.prismaService.refreshToken.delete({ where: { id: tokenRecord.id } });
      throw new ForbiddenException('Refresh token expired');
    }

    // Rotate token: User only allowed one active session per device flow?
    // Current logic deletes logic, implying rotation.
    await this.prismaService.refreshToken.delete({ where: { id: tokenRecord.id } });

    const audience = (payload as any).aud === 'admin' ? 'admin' : 'customer';
    return this.issueTokenPair(payload.sub, audience);
  }

  async logout(dto: import('@modules/auth/dto/logout.dto').LogoutDto) {
    try {
      const payload = await this.jwtService.decode(dto.refreshToken) as any;
      if (!payload?.sub) return { message: 'Logged out successfully' };

      const userId = payload.sub;
      const tokens = await this.prismaService.refreshToken.findMany({ where: { userId } });

      // Invalidate the specific token if it matches
      for (const t of tokens) {
        if (await this.verifyPassword(t.token, dto.refreshToken)) {
          await this.prismaService.refreshToken.delete({ where: { id: t.id } });
          break;
        }
      }
    } catch (e) {
      this.logger.warn(`Logout failed mostly due to invalid token format: ${e.message}`);
    }
    return { message: 'Logged out successfully' };
  }

  // ---------------------------
  // HELPERS
  // ---------------------------

  private async issueTokenPair(userId: string, audience: 'customer' | 'admin' = 'customer'): Promise<AuthResponse> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const roles = user.userRoles.map((ur) => ur.role.slug);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, type: 'access', aud: audience, roles },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES') || TOKEN_EXPIRY.ACCESS,
        } as any,
      ),
      this.jwtService.signAsync(
        { sub: userId, type: 'refresh', aud: audience },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES') || TOKEN_EXPIRY.REFRESH,
        } as any,
      ),
    ]);

    await this.saveRefreshToken(userId, refreshToken);

    return {
      user: sanitizeUser(user),
      tokens: { accessToken, refreshToken },
    };
  }

  private async saveRefreshToken(userId: string, rawToken: string) {
    const tokenHash = await this.hashPassword(rawToken);
    await this.prismaService.refreshToken.create({
      data: {
        userId,
        token: tokenHash,
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

    return {
      valid: true,
      email: user.email,
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
