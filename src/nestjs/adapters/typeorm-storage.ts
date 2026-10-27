import type { Repository } from 'typeorm';
import type { ResourceAccessContext } from '../../core/types';
import type { ResourceAccessStorage } from '../../server/storage';
import type { ResourceAccessUser } from '../../server/types';
import { ResourceOverrideEffect, UserResourceOverride } from '../entity/user-resource-override.entity';

interface UserRecord {
  id: string;
  email: string;
  role: string;
  is_deleted?: boolean;
}

export function createTypeormResourceAccessStorage(
  overrideRepository: Repository<UserResourceOverride>,
  userRepository: Repository<UserRecord>,
): ResourceAccessStorage {
  return {
    async findUser(ctx: ResourceAccessContext): Promise<ResourceAccessUser | null> {
      const user = await userRepository.findOne({
        where: { id: ctx.userId },
        select: ['id', 'email', 'role', 'is_deleted'],
      });
      if (!user || user.is_deleted) {
        return null;
      }
      return user;
    },

    async getUserRoles(ctx: ResourceAccessContext): Promise<string[]> {
      if (ctx.roles?.length) {
        return ctx.roles;
      }
      const user = await this.findUser(ctx);
      return user?.role ? [user.role] : [];
    },

    async loadOverrideMap(ctx: ResourceAccessContext) {
      const rows = await overrideRepository.find({ where: { user_id: ctx.userId } });
      return new Map(rows.map((row) => [row.resource_id, row.effect]));
    },

    async deleteOverride(ctx: ResourceAccessContext, resourceId: string) {
      await overrideRepository.delete({ user_id: ctx.userId, resource_id: resourceId });
    },

    async upsertOverride(ctx, resourceId, effect) {
      await overrideRepository.upsert(
        {
          user_id: ctx.userId,
          resource_id: resourceId,
          effect: effect as unknown as ResourceOverrideEffect,
        },
        ['user_id', 'resource_id'],
      );
    },
  };
}
