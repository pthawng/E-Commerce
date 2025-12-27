/**
 * ABAC Guard
 * Enterprise-level guard với policy engine, caching, và comprehensive error handling
 */

import type { RequestUserPayload } from '@common/types/jwt.types';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import type { BasePolicy } from '../base/base-policy';
import { CHECK_POLICY_KEY, type PolicyMetadata } from '../decorators/policy.decorator';
import { PolicyEngineService } from '../services/policy-engine.service';
import { PolicyAction, type PolicyContext } from '../types/policy.types';
import { PermissionCacheService } from 'src/modules/rbac/cache/permission-cache.service';

@Injectable()
export class AbacGuard implements CanActivate {
  private readonly logger = new Logger(AbacGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly policyEngine: PolicyEngineService,
    private readonly prisma: PrismaService,
    private readonly permissionCacheService: PermissionCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get policy metadata từ decorator
    const metadata = this.reflector.getAllAndOverride<PolicyMetadata>(CHECK_POLICY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu không có policy metadata, allow access
    if (!metadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: RequestUserPayload }>();
    const user = request.user;

    // Validate user context
    if (!user || !user.userId) {
      throw new UnauthorizedException('User context is missing');
    }

    // Build policy context
    const policyContext = await this.buildPolicyContext(request, user, metadata);

    // Get policy instance
    const policyInstance = new metadata.policy();

    // Evaluate policy
    const result = await this.policyEngine.evaluate(policyInstance, policyContext, {
      // Skip cache for write operations
      skipCache: this.isWriteOperation(metadata.action),
    });

    // Check result
    if (!result.allowed) {
      this.logger.warn(
        `Policy denied: ${metadata.policy.name}.${metadata.action} for user ${user.userId}. Reason: ${result.reason || 'Unknown'}`,
      );
      throw new ForbiddenException(result.reason || 'Bạn không có quyền thực hiện hành động này');
    }

    return true;
  }

  /**
   * Build policy context từ request
   */
  private async buildPolicyContext(
    request: Request,
    user: any,
    metadata: PolicyMetadata,
  ): Promise<PolicyContext> {
    // Resolve resource
    let resource: unknown = null;

    if (metadata.resourceResolver) {
      // Use custom resource resolver
      resource = await metadata.resourceResolver(request);
    } else if (metadata.param) {
      // Auto-resolve resource từ Prisma
      const resourceId = request.params[metadata.param];
      if (resourceId) {
        resource = await this.resolveResourceFromPrisma(metadata.policy, resourceId);
      }
    }

    // Build environment context
    const environment = {
      timestamp: new Date(),
      ipAddress: request.ip || request.socket.remoteAddress,
      userAgent: request.get('user-agent'),
    };

    // Build request context
    const requestContext = {
      method: request.method,
      path: request.path,
      query: request.query,
      body: request.body,
    };

    // Populate permissions from cache (RBAC) because JWT does not contain permissions.
    // If cache fails, fall back to any permissions present on JWT (usually none).
    let permissions: string[] = user.permissions || [];
    try {
      const cached = await this.permissionCacheService.getPermissions(user.userId);
      if (cached && cached.length) permissions = cached;
    } catch (e) {
      this.logger.warn(`Failed to load permission cache for user ${user.userId}: ${e?.message || e}`);
    }

    return {
      user: {
        ...user,
        permissions,
      },
      resource,
      action: metadata.action,
      environment,
      request: requestContext,
    };
  }

  /**
   * Resolve resource từ Prisma dựa trên policy name
   */
  private async resolveResourceFromPrisma(
    PolicyClass: new () => BasePolicy,
    resourceId: string,
  ): Promise<unknown> {
    // Extract model name từ policy class name
    // Ví dụ: OrderPolicy -> order
    const policyName = PolicyClass.name;
    const modelName = policyName.replace('Policy', '').toLowerCase();

    // Map policy names to Prisma model names
    const modelMap: Record<string, string> = {
      order: 'order',
      product: 'product',
      user: 'user',
      variant: 'productVariant',
      // Add more mappings as needed
    };

    const prismaModelName = modelMap[modelName] || modelName;

    // Get Prisma client model
    const prismaModel = (this.prisma as any)[prismaModelName];
    if (!prismaModel) {
      this.logger.warn(`Could not resolve Prisma model for policy: ${policyName}`);
      return null;
    }

    try {
      return await prismaModel.findUnique({
        where: { id: resourceId },
      });
    } catch (error) {
      this.logger.error(`Error resolving resource for ${policyName}: ${resourceId}`, error);
      return null;
    }
  }

  /**
   * Check if action is a write operation
   */
  private isWriteOperation(action: PolicyAction): boolean {
    return [PolicyAction.CREATE, PolicyAction.UPDATE, PolicyAction.DELETE].includes(action);
  }
}
