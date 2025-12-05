import type { User } from '@shared';

export function sanitizeUser(
  user: any,
): Pick<User, 'id' | 'email' | 'phone' | 'fullName' | 'isActive' | 'isEmailVerified'> {
  // Lọc bỏ các field nhạy cảm trước khi trả client
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
  };
}
