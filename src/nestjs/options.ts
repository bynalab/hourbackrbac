import type { Type, CanActivate } from '@nestjs/common';
import type { ResourceCatalogueConfig } from '../core/types';

export const RESOURCE_ACCESS_OPTIONS = 'RESOURCE_ACCESS_OPTIONS';

export interface ResourceAccessModuleOptions {
  /** Host-defined catalogue tree and role domain grants */
  catalogue: ResourceCatalogueConfig;
  /** TypeORM entity class for users (must have id, email, role, is_deleted?) */
  userEntity: Type<unknown>;
  /** Roles that bypass all checks (default: ['super_admin']) */
  godModeRoles?: string[];
  /** Roles allowed to use admin resource-access endpoints (default: ['super_admin']) */
  adminRoles?: string[];
  /** Guards applied to GET /resource-access/me (host auth, e.g. JWT or X-User-Id) */
  authGuards?: Type<CanActivate>[];
  /** Extra guards on admin endpoints (optional — package includes role check) */
  adminGuards?: Type<CanActivate>[];
  /**
   * Controller base path for admin CRUD.
   * Default `admin/resource-access`. Kenya TNT uses `admin/rbac` for backward compatibility.
   */
  adminControllerPath?: string;
  /** Register HTTP controllers (default true) */
  registerControllers?: boolean;
}

export interface ResourceAccessOptionsResolved extends ResourceAccessModuleOptions {
  godModeRoles: string[];
  adminRoles: string[];
  adminControllerPath: string;
  registerControllers: boolean;
}

export function resolveOptions(
  options: ResourceAccessModuleOptions,
): ResourceAccessOptionsResolved {
  return {
    ...options,
    godModeRoles: options.godModeRoles ?? ['super_admin'],
    adminRoles: options.adminRoles ?? ['super_admin'],
    adminControllerPath: options.adminControllerPath ?? 'admin/resource-access',
    registerControllers: options.registerControllers !== false,
  };
}
