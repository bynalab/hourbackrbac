import type { FlatResourceNode, ResourceCatalogueConfig, ResourceNode } from './types';
export declare function flattenResourceTree(nodes: ResourceNode[], parentId?: string | null, depth?: number): FlatResourceNode[];
export declare function getResourcePathIds(resourceId: string, tree: ResourceNode[]): string[];
export declare function getDomainIdForResource(resourceId: string, tree: ResourceNode[]): string | null;
export declare function roleGrantsDomain(role: string, domainId: string, roleDomainGrants: Record<string, string[]>): boolean;
export declare function getCatalogueForRole(role: string, config: ResourceCatalogueConfig): ResourceNode[];
export declare function resolveResourceIdForPath(pathname: string, sidebarResourceByPath: Record<string, string>): string | null;
export declare function isProtectedPath(pathname: string, sidebarResourceByPath: Record<string, string>): boolean;
export type TreeNodeWithState<T extends ResourceNode, N> = T & {
    state?: N;
    children?: TreeNodeWithState<T, N>[];
};
export declare function buildNodeTree<T extends ResourceNode, N extends {
    id: string;
}>(tree: T[], nodes: N[]): TreeNodeWithState<T, N>[];
export declare function sourceLabel(source: string): string;
