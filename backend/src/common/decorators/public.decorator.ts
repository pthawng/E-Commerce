import { SetMetadata } from '@nestjs/common';

/**
 * Decorator để đánh dấu route là public (không cần authentication)
 * Sử dụng với Global Guard để skip authentication cho các routes này
 *
 * @example
 * @Public()
 * @Post('login')
 * async login() { ... }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
