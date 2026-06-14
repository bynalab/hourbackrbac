import type { FlatResourceNode, ResourceAccessNodeState, ResourceCatalogueConfig, ResourceOverrideEffect } from '../core/types';
export declare function buildNodeState(role: string, node: FlatResourceNode, overrides: Map<string, ResourceOverrideEffect>, config: ResourceCatalogueConfig, godModeRoles: string[]): ResourceAccessNodeState;
export declare function computeAllowedResourceIds(role: string, overrides: Map<string, ResourceOverrideEffect>, config: ResourceCatalogueConfig, godModeRoles: string[]): string[];
export declare function canAccessResource(role: string, resourceId: string, overrides: Map<string, ResourceOverrideEffect>, config: ResourceCatalogueConfig, godModeRoles: string[]): boolean;
export declare function roleDefaultAllows(role: string, resourceId: string, config: ResourceCatalogueConfig, godModeRoles: string[]): boolean;
