import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';
import { IS_OPTIONAL_AUTH_KEY } from '@common/decorators/optional-auth.decorator';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAccessGuard sẽ dùng strategy 'jwt-access'
 */
@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt-access') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check for @Public() - Skip all auth
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 2. Check for @OptionalAuth() - Mark for non-blocking auth
    const isOptional = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Attach isOptional to the request so handleRequest can access it
    const request = context.switchToHttp().getRequest();
    request['isOptionalAuth'] = isOptional;

    // Execute standard Passport validation
    // If isOptional is true, handleRequest will prevent 401 on failure
    try {
      return (await super.canActivate(context)) as boolean;
    } catch (err) {
      if (isOptional) return true;
      throw err;
    }
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const isOptional = request['isOptionalAuth'];

    if (isOptional) {
      // If optional and error/no-user, return null instead of throwing 401
      if (err || !user) {
        return null;
      }
      return user;
    }

    // Default behavior for non-optional routes
    return super.handleRequest(err, user, info, context);
  }
}
