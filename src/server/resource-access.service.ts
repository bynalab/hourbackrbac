import { flattenResourceTree, getDescendantResourceIds } from '../core/catalogue';
import {
  buildNodeStateMultiRole,
  canAccessResourceMultiRole,
  computeAllowedResourceIdsMultiRole,
  rolesDefaultAllow,
} from '../core/resolve-access';
import type {
  MyResourceAccessResponse,
  ResourceAccessContext,
  ResourceAccessNodeState,
  ResourceOverrideEffect,
  UserResourceAccessResponse,
} from '../core/types';
import { toResourceAccessContext } from './context';
import { ResourceAccessBadRequestError, ResourceAccessNotFoundError } from './errors';
import type { ResourceAccessServiceOptionsResolved } from './options';
import type { ResourceAccessStorage } from './storage';

export class ResourceAccessService {
  constructor(
    private readonly options: ResourceAccessServiceOptionsResolved,
    private readonly storage: ResourceAccessStorage,
  ) {}

  getCatalogue() {
    return { tree: this.options.catalogue.tree };
  }

  async getUserResourceAccess(
    userIdOrCtx: string | ResourceAccessContext,
  ): Promise<UserResourceAccessResponse> {
    const ctx = this.normalizeContext(userIdOrCtx);
    const user = await this.findUser(ctx);
    const roles = await this.resolveRoles(ctx);
    const overrides = await this.storage.loadOverrideMap(ctx);
    const tree = this.options.catalogue.tree;
    const flat = flattenResourceTree(tree);
    const nodes = flat.map((node) =>
      buildNodeStateMultiRole(
        roles,
        node,
        overrides,
        this.options.catalogue,
        this.options.godModeRoles,
      ),
    );
    const primaryRole = user.role ?? roles[0] ?? '';
    return {
      user: { id: user.id, email: user.email, role: primaryRole, roles },
      tree,
      nodes,
      allowed_resource_ids: computeAllowedResourceIdsMultiRole(
        roles,
        overrides,
        this.options.catalogue,
        this.options.godModeRoles,
      ),
      tenantId: ctx.tenantId,
    };
  }

  async getMyResourceAccess(
    userIdOrCtx: string | ResourceAccessContext,
  ): Promise<MyResourceAccessResponse> {
    const ctx = this.normalizeContext(userIdOrCtx);
    const roles = await this.resolveRoles(ctx);
    const overrides = await this.storage.loadOverrideMap(ctx);
    const allowed_resource_ids = computeAllowedResourceIdsMultiRole(
      roles,
      overrides,
      this.options.catalogue,
      this.options.godModeRoles,
    );
    const isSuperAdmin = roles.some((role) => this.options.godModeRoles.includes(role));
    return { allowed_resource_ids, roles, isSuperAdmin };
  }

  canAccessForRoles(
    roles: string[],
    resourceId: string,
    overrides: Map<string, ResourceOverrideEffect>,
  ): boolean {
    return canAccessResourceMultiRole(
      roles,
      resourceId,
      overrides,
      this.options.catalogue,
      this.options.godModeRoles,
    );
  }

  canAccess(
    role: string,
    resourceId: string,
    overrides: Map<string, ResourceOverrideEffect>,
  ): boolean {
    return this.canAccessForRoles([role], resourceId, overrides);
  }

  async canAccessResourceForContext(
    ctx: ResourceAccessContext,
    resourceId: string,
  ): Promise<boolean> {
    await this.findUser(ctx);
    const roles = await this.resolveRoles(ctx);
    const overrides = await this.storage.loadOverrideMap(ctx);
    return this.canAccessForRoles(roles, resourceId, overrides);
  }

  async canAccessResourceForUser(userId: string, resourceId: string): Promise<boolean> {
    return this.canAccessResourceForContext(toResourceAccessContext(userId), resourceId);
  }

  async batchUpdateOverrides(
    userIdOrCtx: string | ResourceAccessContext,
    items: Array<{ resource_id: string; effect: ResourceOverrideEffect | null }>,
  ): Promise<UserResourceAccessResponse> {
    const ctx = this.normalizeContext(userIdOrCtx);
    const roles = await this.resolveRoles(ctx);
    this.assertResourceAccessEditable(roles);

    for (const item of items) {
      if (item.effect === null) {
        await this.storage.deleteOverride(ctx, item.resource_id);
        continue;
      }

      await this.storage.upsertOverride(ctx, item.resource_id, item.effect);
    }

    return this.getUserResourceAccess(ctx);
  }

  async toggleResourceAccess(
    userIdOrCtx: string | ResourceAccessContext,
    resourceId: string,
    allowed: boolean,
  ): Promise<UserResourceAccessResponse> {
    const ctx = this.normalizeContext(userIdOrCtx);
    const roles = await this.resolveRoles(ctx);
    this.assertResourceAccessEditable(roles);
    const roleWouldGrant = rolesDefaultAllow(
      roles,
      resourceId,
      this.options.catalogue,
      this.options.godModeRoles,
    );

    if (allowed) {
      await this.clearDescendantOverrides(ctx, resourceId);
    }

    const effect: ResourceOverrideEffect | null = allowed
      ? roleWouldGrant
        ? null
        : 'allow'
      : 'deny';

    return this.batchUpdateOverrides(ctx, [{ resource_id: resourceId, effect }]);
  }

  private async clearDescendantOverrides(ctx: ResourceAccessContext, resourceId: string) {
    const descendants = getDescendantResourceIds(resourceId, this.options.catalogue.tree);
    for (const descendantId of descendants) {
      if (descendantId === resourceId) {
        continue;
      }
      await this.storage.deleteOverride(ctx, descendantId);
    }
  }

  private assertResourceAccessEditable(roles: string[]): void {
    const godRole = roles.find((role) => this.options.godModeRoles.includes(role));
    if (godRole) {
      throw new ResourceAccessBadRequestError(
        `Resource access overrides do not apply to ${godRole} users`,
      );
    }
  }

  async getRolesForContext(ctx: ResourceAccessContext): Promise<string[]> {
    return this.resolveRoles(ctx);
  }

  private async resolveRoles(ctx: ResourceAccessContext): Promise<string[]> {
    if (ctx.roles?.length) {
      return ctx.roles;
    }
    return this.storage.getUserRoles(ctx);
  }

  private normalizeContext(userIdOrCtx: string | ResourceAccessContext): ResourceAccessContext {
    return typeof userIdOrCtx === 'string' ? toResourceAccessContext(userIdOrCtx) : userIdOrCtx;
  }

  private async findUser(ctx: ResourceAccessContext) {
    const user = await this.storage.findUser(ctx);
    if (!user || user.is_deleted) {
      throw new ResourceAccessNotFoundError();
    }
    return user;
  }
}

export type { ResourceAccessNodeState };
