import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Gắn permission yêu cầu cho route
 * Ví dụ: @Permission('user.update')
 */
export const Permission = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
