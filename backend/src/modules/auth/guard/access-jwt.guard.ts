import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAccessGuard sẽ dùng strategy 'jwt-access'
 *
 * Mục đích:
 * - Kiểm tra Authorization header có Bearer token không
 * - Passport sẽ verify token và chạy JwtAccessStrategy.validate()
 * - Nếu token invalid / expired / type sai → trả lỗi 401
 * - Skip authentication cho routes có @Public() decorator
 *
 * Sử dụng:
 *
 * @UseGuards(JwtAccessGuard)
 * @Get('profile')
 * getProfile(@Req() req) {
 *   return req.user; // đã có payload chuẩn từ validate()
 * }
 *
 * Hoặc dùng @Public() để skip authentication:
 * @Public()
 * @Post('login')
 * async login() { ... }
 */
@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt-access') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Kiểm tra xem route có @Public() decorator không
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu là public route, skip authentication
    if (isPublic) {
      return true;
    }

    // Nếu không phải public, chạy authentication bình thường
    return super.canActivate(context);
  }
}
