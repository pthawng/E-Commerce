import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(private readonly configService: ConfigService) {
    /**
     * Lấy SECRET từ config và kiểm tra.
     * Không dùng process.env trực tiếp để tránh anti-pattern.
     */
    const secret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not defined!');
    }
    /**
     * Gọi super() để cấu hình Passport JWT Strategy.
     * jwtFromRequest: Lấy token từ header Authorization: Bearer <token>
     * secretOrKey: SECRET để giải mã token
     * ignoreExpiration: false, bắt buộc phải hết hạn
     */
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    /**
     * TODO
     * kiểm tra user bị khóa / deactivated?
     * nếu có userService thì:
     *
     * const user = await this.userService.findById(payload.sub);
     * if (!user || !user.isActive) throw new UnauthorizedException();
     */
    /**
     * Giá trị trả về của validate() sẽ được gắn vào req.user
     * và có thể dùng tại Controller thông qua:
     *
     * @Req() req => req.user
     * hoặc
     * @CurrentUser() decorator custom
     */
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles ?? [],
    };
  }
}
