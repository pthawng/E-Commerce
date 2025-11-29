export function sanitizeUser(user: any) {
  // Lọc bỏ các field nhạy cảm trước khi trả client
  const { passwordHash, refreshToken, ...safeUser } = user;
  return safeUser;
}
