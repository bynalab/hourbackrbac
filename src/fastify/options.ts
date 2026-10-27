import type { ResourceCatalogueConfig } from '../core/types';
import type { ResourceAccessServiceOptions } from '../server/options';
import type { ResourceAccessStorage } from '../server/storage';
import type { ResourceAccessContext } from '../server/types';
import type { PgUserTableConfig } from './pg-storage';

export interface UiResourceAccessFastifyOptions extends ResourceAccessServiceOptions {
  /** PostgreSQL connection pool (ignored when `storage` is provided) */
  pool?: import('pg').Pool;
  /** Pluggable storage — defaults to single-role PG adapter when `pool` is set */
  storage?: ResourceAccessStorage;
  /** Guards applied to user-facing routes (e.g. JWT auth) */
  preHandlers?: import('fastify').preHandlerHookHandler[];
  /** Extra guards on admin routes (after auth + admin role check) */
  adminPreHandlers?: import('fastify').preHandlerHookHandler[];
  /** Controller base path for admin CRUD (default `admin/resource-access`) */
  adminControllerPath?: string;
  /** Register HTTP routes (default true) */
  registerRoutes?: boolean;
  /** Optional URL prefix for all routes (e.g. `/api`) */
  routePrefix?: string;
  /** Map request → resource access context (userId, tenantId, optional roles) */
  getContext: (req: import('fastify').FastifyRequest) => ResourceAccessContext | null | undefined;
  /**
   * @deprecated Use `getContext`. Mapped automatically when only `getUser` is provided.
   */
  getUser?: (req: import('fastify').FastifyRequest) => { id: string; role: string } | null | undefined;
  /** User table mapping for the default single-role PG adapter */
  userTable?: PgUserTableConfig;
}

export interface UiResourceAccessFastifyOptionsResolved extends UiResourceAccessFastifyOptions {
  godModeRoles: string[];
  adminRoles: string[];
  adminControllerPath: string;
  registerRoutes: boolean;
  routePrefix: string;
  getContext: (req: import('fastify').FastifyRequest) => ResourceAccessContext | null | undefined;
}

export function resolveFastifyOptions(
  options: UiResourceAccessFastifyOptions,
): UiResourceAccessFastifyOptionsResolved {
  const getContext =
    options.getContext ??
    ((req) => {
      const user = options.getUser?.(req);
      return user ? { userId: user.id, roles: [user.role] } : null;
    });

  if (!options.storage && !options.pool) {
    throw new Error('createUiResourceAccess requires either `storage` or `pool`');
  }

  return {
    ...options,
    getContext,
    godModeRoles: options.godModeRoles ?? ['super_admin'],
    adminRoles: options.adminRoles ?? ['super_admin'],
    adminControllerPath: options.adminControllerPath ?? 'admin/resource-access',
    registerRoutes: options.registerRoutes !== false,
    routePrefix: options.routePrefix ?? '',
  };
}

export type { ResourceCatalogueConfig };
