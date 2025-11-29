import { LoginDto } from '@modules/auth/dto/login.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { sanitizeUser } from '@modules/auth/sanitize/user.sanitize';
import { UserService } from '@modules/user/user.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import argon2 from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
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

    // TODO: Tạo AccessToken và Refresh Token
    const user = await this.prismaService.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
      },
    });

    // TODO: Gửi email xác thực
    return sanitizeUser(user);
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

    if (!user) throw new UnauthorizedException('Thông tin đăng nhập không đúng');

    const isMatch = await argon2.verify(dto.password, user.passwordHash!);
    if (!isMatch) throw new UnauthorizedException('Mật khẩu không đúng');

    return this.issueTokenPair(user.id);
  }

  // -------------------------------------------------------------------------
  // PRIVATE METHODS
  // -------------------------------------------------------------------------
  private async issueTokenPair(userId: string) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRES,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES,
      },
    );

    await this.saveRefreshToken(userId, refreshToken);

    const user = await this.prismaService.user.findUnique({ where: { id: userId } });

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const tokenHash = await argon2.hash(token);

    await this.prismaService.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      },
    });
  }

  private async verifyRefreshToken(token: string) {
    try {
      return this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new ForbiddenException('Refresh token không hợp lệ');
    }
  }
}
