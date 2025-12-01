import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAccessGuard sẽ dùng strategy 'jwt-access'
 *
 * Mục đích:
 * - Kiểm tra Authorization header có Bearer token không
 * - Passport sẽ verify token và chạy JwtAccessStrategy.validate()
 * - Nếu token invalid / expired / type sai → trả lỗi 401
 *
 * Sử dụng:
 *
 * @UseGuards(JwtAccessGuard)
 * @Get('profile')
 * getProfile(@Req() req) {
 *   return req.user; // đã có payload chuẩn từ validate()
 * }
 */
@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt-access') {}
