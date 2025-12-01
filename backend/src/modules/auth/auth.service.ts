import { LoginDto } from '@modules/auth/dto/login.dto';
import { RefreshTokenDto } from '@modules/auth/dto/refresh-token.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { sanitizeUser } from '@modules/auth/sanitize/user.sanitize';
import { VerifyEmailService } from '@modules/auth/services/verify-email.auth.service';
import { UserService } from '@modules/user/user.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly verifyEmailService: VerifyEmailService,
  ) {}

  // ---------------------------
  // REGISTER
  // ---------------------------
  async register(dto: RegisterDto) {
    // Check unique email
    const existEmail = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });
    if (existEmail) throw new BadRequestException('Email already exists');

    // Hash password
    const passwordHash = await argon2.hash(dto.password!, {
      type: argon2.argon2id,
      timeCost: 2,
      memoryCost: 19456,
      parallelism: 1,
    });

    const user = await this.prismaService.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
      },
    });
    // Send verify email (fail => rollback user creation)
    try {
      await this.verifyEmailService.sendVerifyEmail({
        id: user.id,
        email: user.email,
        fullName: user.fullName ?? user.email,
      });
    } catch (error) {
      await this.prismaService.user.delete({ where: { id: user.id } });
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException('Không thể gửi email xác minh, vui lòng thử lại.');
    }

    // Tạo AccessToken và Refresh Token sau khi gửi mail thành công
    const { accessToken, refreshToken } = await this.issueTokenPair(user.id);

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  // ---------------------------
  // LOGIN
  // ---------------------------
  async login(dto: LoginDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email hoặc phone bắt buộc');
    }

    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [
          dto.email ? { email: dto.email } : undefined,
          dto.phone ? { phone: dto.phone } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không đúng');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Tài khoản chưa được thiết lập mật khẩu');
    }

    const isMatch = await argon2.verify(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Mật khẩu không đúng');
    }

    return this.issueTokenPair(user.id);
  }

  // ---------------------------
  // REFRESH TOKEN
  // ---------------------------
  async refreshToken(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);

    const tokenRecord = await this.prismaService.refreshToken.findFirst({
      where: { userId: payload.sub },
      orderBy: { createdAt: 'desc' },
    });

    if (!tokenRecord) {
      throw new ForbiddenException('Refresh token không tồn tại');
    }

    // Verify token hash
    const isValid = await argon2.verify(tokenRecord.token, dto.refreshToken);
    if (!isValid) {
      throw new ForbiddenException('Refresh token không hợp lệ');
    }

    // Check if token expired
    if (tokenRecord.expiresAt < new Date()) {
      throw new ForbiddenException('Refresh token đã hết hạn');
    }

    // Delete old refresh token
    await this.prismaService.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    return this.issueTokenPair(payload.sub);
  }

  // -------------------------------------------------------------------------
  // PRIVATE METHODS
  // -------------------------------------------------------------------------
  private async issueTokenPair(userId: string) {
    // Lấy thông tin user trước để đưa vào JWT payload
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

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);

    // Tạo Access Token với đầy đủ thông tin
    const accessToken = await this.jwtService.signAsync(
      {
        sub: userId,
        type: 'access',
        email: user.email,
        roles,
      },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES') || '15m',
      } as any,
    );

    // Tạo Refresh Token với type
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: userId,
        type: 'refresh',
      },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES') || '7d',
      } as any,
    );

    await this.saveRefreshToken(userId, refreshToken);

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(_userId: string, _token: string) {
    const token = await argon2.hash(_token);
    await this.prismaService.refreshToken.create({
      data: {
        userId: _userId,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      },
    });
  }

  private async verifyRefreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      return payload as { sub: string };
    } catch {
      throw new ForbiddenException('Refresh token không hợp lệ');
    }
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
    const isValid = await argon2.verify(tokenRecord.token, refreshToken);
    if (!isValid) {
      return null;
    }

    // Check if token expired
    if (tokenRecord.expiresAt < new Date()) {
      return null;
    }

    // Trả về user với roles
    return {
      id: user.id,
      email: user.email,
      roles: user.userRoles.map((ur) => ur.role.name),
    };
  }
}
