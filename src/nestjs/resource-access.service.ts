import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ResourceAccessContext } from '../core/types';
import {
  ResourceAccessService as CoreResourceAccessService,
  ResourceAccessBadRequestError,
  ResourceAccessNotFoundError,
  type ResourceAccessNodeState,
} from '../server';
import { ResourceOverrideEffect } from '../server/types';
import { RESOURCE_ACCESS_OPTIONS, type ResourceAccessOptionsResolved } from './options';

@Injectable()
export class ResourceAccessService {
  constructor(
    private readonly inner: CoreResourceAccessService,
    @Inject(RESOURCE_ACCESS_OPTIONS)
    private readonly options: ResourceAccessOptionsResolved,
  ) {}

  resolveContext(request: { user?: { id?: string; role?: string } }): ResourceAccessContext {
    if (this.options.getContextFromRequest) {
      return this.options.getContextFromRequest(request);
    }
    if (!request.user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return {
      userId: request.user.id,
      roles: request.user.role ? [request.user.role] : undefined,
    };
  }

  targetContext(
    request: { user?: { id?: string; role?: string } },
    targetUserId: string,
  ): ResourceAccessContext {
    const base = this.resolveContext(request);
    return {
      userId: targetUserId,
      tenantId: base.tenantId,
    };
  }

  getCatalogue() {
    return this.inner.getCatalogue();
  }

  getUserResourceAccess(userIdOrCtx: string | ResourceAccessContext) {
    return this.mapErrors(() => this.inner.getUserResourceAccess(userIdOrCtx));
  }

  getMyResourceAccess(userIdOrCtx: string | ResourceAccessContext) {
    return this.mapErrors(() => this.inner.getMyResourceAccess(userIdOrCtx));
  }

  canAccess(
    role: string,
    resourceId: string,
    overrides: Map<string, ResourceOverrideEffect>,
  ) {
    return this.inner.canAccess(role, resourceId, overrides);
  }

  canAccessResourceForContext(ctx: ResourceAccessContext, resourceId: string) {
    return this.mapErrors(() => this.inner.canAccessResourceForContext(ctx, resourceId));
  }

  canAccessResourceForUser(userId: string, resourceId: string) {
    return this.mapErrors(() => this.inner.canAccessResourceForUser(userId, resourceId));
  }

  batchUpdateOverrides(
    userIdOrCtx: string | ResourceAccessContext,
    items: Array<{ resource_id: string; effect: ResourceOverrideEffect | null }>,
  ) {
    return this.mapErrors(() => this.inner.batchUpdateOverrides(userIdOrCtx, items));
  }

  toggleResourceAccess(
    userIdOrCtx: string | ResourceAccessContext,
    resourceId: string,
    allowed: boolean,
  ) {
    return this.mapErrors(() => this.inner.toggleResourceAccess(userIdOrCtx, resourceId, allowed));
  }

  getRolesForRequest(ctx: ResourceAccessContext) {
    return this.inner.getRolesForContext(ctx);
  }

  private async mapErrors<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof ResourceAccessNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof ResourceAccessBadRequestError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}

export type { ResourceAccessNodeState };
