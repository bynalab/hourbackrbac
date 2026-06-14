import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { flattenResourceTree, getCatalogueForRole } from '../core/catalogue';
import {
  buildNodeState,
  canAccessResource,
  roleDefaultAllows,
} from '../core/resolve-access';
import type {
  MyResourceAccessResponse,
  ResourceAccessNodeState,
  UserResourceAccessResponse,
} from '../core/types';
import { ResourceOverrideEffect, UserResourceOverride } from './entity/user-resource-override.entity';
import { RESOURCE_ACCESS_OPTIONS, type ResourceAccessOptionsResolved } from './options';

interface UserRecord {
  id: string;
  email: string;
  role: string;
  is_deleted?: boolean;
}

@Injectable()
export class ResourceAccessService {
  constructor(
    @Inject(RESOURCE_ACCESS_OPTIONS)
    private readonly options: ResourceAccessOptionsResolved,
    private readonly overrideRepository: Repository<UserResourceOverride>,
    private readonly userRepository: Repository<UserRecord>,
  ) {}

  getCatalogue() {
    return { tree: this.options.catalogue.tree };
  }

  async getUserResourceAccess(userId: string): Promise<UserResourceAccessResponse> {
    const user = await this.findUser(userId);
    const overrides = await this.loadOverrideMap(userId);
    const tree = getCatalogueForRole(user.role, this.options.catalogue);
    const flat = flattenResourceTree(tree);
    const nodes = flat.map((node) =>
      buildNodeState(
        user.role,
        node,
        overrides,
        this.options.catalogue,
        this.options.godModeRoles,
      ),
    );
    return {
      user: { id: user.id, email: user.email, role: user.role },
      tree,
      nodes,
      allowed_resource_ids: nodes.filter((n) => n.effective).map((n) => n.id),
    };
  }

  async getMyResourceAccess(userId: string): Promise<MyResourceAccessResponse> {
    const { allowed_resource_ids } = await this.getUserResourceAccess(userId);
    return { allowed_resource_ids };
  }

  canAccess(
    role: string,
    resourceId: string,
    overrides: Map<string, ResourceOverrideEffect>,
  ): boolean {
    return canAccessResource(
      role,
      resourceId,
      overrides,
      this.options.catalogue,
      this.options.godModeRoles,
    );
  }

  async canAccessResourceForUser(userId: string, resourceId: string): Promise<boolean> {
    const user = await this.findUser(userId);
    const overrides = await this.loadOverrideMap(userId);
    return this.canAccess(user.role, resourceId, overrides);
  }

  async batchUpdateOverrides(
    userId: string,
    items: Array<{ resource_id: string; effect: ResourceOverrideEffect | null }>,
  ): Promise<UserResourceAccessResponse> {
    const user = await this.findUser(userId);
    this.assertResourceAccessEditable(user);

    for (const item of items) {
      if (item.effect === null) {
        await this.overrideRepository.delete({
          user_id: userId,
          resource_id: item.resource_id,
        });
        continue;
      }

      await this.overrideRepository.upsert(
        {
          user_id: userId,
          resource_id: item.resource_id,
          effect: item.effect,
        },
        ['user_id', 'resource_id'],
      );
    }

    return this.getUserResourceAccess(userId);
  }

  async toggleResourceAccess(
    userId: string,
    resourceId: string,
    allowed: boolean,
  ): Promise<UserResourceAccessResponse> {
    const user = await this.findUser(userId);
    this.assertResourceAccessEditable(user);
    const overrides = await this.loadOverrideMap(userId);
    const roleWouldGrant = roleDefaultAllows(
      user.role,
      resourceId,
      this.options.catalogue,
      this.options.godModeRoles,
    );

    let effect: ResourceOverrideEffect | null;
    if (allowed) {
      effect = roleWouldGrant ? null : ResourceOverrideEffect.ALLOW;
    } else {
      effect = ResourceOverrideEffect.DENY;
    }

    return this.batchUpdateOverrides(userId, [{ resource_id: resourceId, effect }]);
  }

  private assertResourceAccessEditable(user: UserRecord): void {
    if (this.options.godModeRoles.includes(user.role)) {
      throw new BadRequestException(
        `Resource access overrides do not apply to ${user.role} users`,
      );
    }
  }

  private async findUser(userId: string): Promise<UserRecord> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'role', 'is_deleted'],
    });
    if (!user || user.is_deleted) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async loadOverrideMap(
    userId: string,
  ): Promise<Map<string, ResourceOverrideEffect>> {
    const rows = await this.overrideRepository.find({ where: { user_id: userId } });
    return new Map(rows.map((r) => [r.resource_id, r.effect]));
  }
}

export type { ResourceAccessNodeState };
