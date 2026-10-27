import type { ResourceAccessContext } from './types';

/** Build a context from a bare user id (v0.2-compatible single-tenant apps). */
export function toResourceAccessContext(
  userId: string,
  tenantId?: string,
  roles?: string[],
): ResourceAccessContext {
  return { userId, tenantId, roles };
}

export function assertResourceAccessContext(
  ctx: ResourceAccessContext | null | undefined,
): asserts ctx is ResourceAccessContext {
  if (!ctx?.userId) {
    throw new Error('Resource access context requires userId');
  }
}
