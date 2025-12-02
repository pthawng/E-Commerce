import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

type RequestUserPayload = {
  userId: string;
  email?: string;
  roles?: string[];
  [key: string]: unknown;
};

const getRequestUser = (ctx: ExecutionContext): RequestUserPayload | undefined => {
  const request = ctx.switchToHttp().getRequest();
  return request?.user as RequestUserPayload | undefined;
};

/**
 * Lấy toàn bộ payload user đã được JwtAccessStrategy.validate() trả về.
 * Có thể truyền key để lấy nhanh một field cụ thể.
 *
 * @example
 * changePassword(@CurrentUser() user) {}
 * changePassword(@CurrentUser('email') email: string) {}
 */
export const CurrentUser = createParamDecorator<keyof RequestUserPayload | undefined>(
  (data, ctx) => {
    const user = getRequestUser(ctx);
    if (!user) {
      throw new UnauthorizedException('User context is missing');
    }
    return data ? user[data] : user;
  },
);

/**
 * Helper decorator chỉ lấy userId để controller gọn hơn.
 */
export const CurrentUserId = createParamDecorator<never>((_data, ctx) => {
  const user = getRequestUser(ctx);
  if (!user?.userId) {
    throw new UnauthorizedException('User id not found in request context');
  }
  return user.userId;
});
