import type { ResourceCatalogueConfig } from '../core/types';

export interface ResourceAccessServiceOptions {
  catalogue: ResourceCatalogueConfig;
  godModeRoles?: string[];
  adminRoles?: string[];
}

export interface ResourceAccessServiceOptionsResolved extends ResourceAccessServiceOptions {
  godModeRoles: string[];
  adminRoles: string[];
}

export function resolveServiceOptions(
  options: ResourceAccessServiceOptions,
): ResourceAccessServiceOptionsResolved {
  return {
    ...options,
    godModeRoles: options.godModeRoles ?? ['super_admin'],
    adminRoles: options.adminRoles ?? ['super_admin'],
  };
}
