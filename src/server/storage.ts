import type { ResourceAccessContext } from './types';
import type { ResourceOverrideEffect } from '../core/types';

export type { ResourceAccessContext } from './types';

export interface ResourceAccessStorage {
  findUser(ctx: ResourceAccessContext): Promise<import('./types').ResourceAccessUser | null>;
  getUserRoles(ctx: ResourceAccessContext): Promise<string[]>;
  loadOverrideMap(ctx: ResourceAccessContext): Promise<Map<string, ResourceOverrideEffect>>;
  upsertOverride(
    ctx: ResourceAccessContext,
    resourceId: string,
    effect: ResourceOverrideEffect,
  ): Promise<void>;
  deleteOverride(ctx: ResourceAccessContext, resourceId: string): Promise<void>;
}
