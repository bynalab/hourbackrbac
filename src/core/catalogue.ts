import type { FlatResourceNode, ResourceCatalogueConfig, ResourceNode } from './types';

export function flattenResourceTree(
  nodes: ResourceNode[],
  parentId: string | null = null,
  depth = 0,
): FlatResourceNode[] {
  const result: FlatResourceNode[] = [];
  for (const node of nodes) {
    result.push({
      id: node.id,
      type: node.type,
      label: node.label,
      path: node.path,
      parent_id: parentId,
      depth,
    });
    if (node.children?.length) {
      result.push(...flattenResourceTree(node.children, node.id, depth + 1));
    }
  }
  return result;
}

export function getResourcePathIds(resourceId: string, tree: ResourceNode[]): string[] {
  const flat = flattenResourceTree(tree);
  const byId = new Map(flat.map((n) => [n.id, n]));
  const path: string[] = [];
  let current = byId.get(resourceId);
  while (current) {
    path.unshift(current.id);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return path;
}

export function getDomainIdForResource(resourceId: string, tree: ResourceNode[]): string | null {
  const path = getResourcePathIds(resourceId, tree);
  return path[0] ?? null;
}

export function roleGrantsDomain(
  role: string,
  domainId: string,
  roleDomainGrants: Record<string, string[]>,
): boolean {
  const grants = roleDomainGrants[role] ?? [];
  if (grants.includes('*')) {
    return true;
  }
  return grants.includes(domainId);
}

export function getCatalogueForRole(
  role: string,
  config: ResourceCatalogueConfig,
): ResourceNode[] {
  const { tree, role_domain_grants: roleDomainGrants } = config;
  if (roleDomainGrants[role]?.includes('*')) {
    return tree;
  }
  const granted = new Set(roleDomainGrants[role] ?? []);
  return tree.filter((node) => granted.has(node.id));
}

export function resolveResourceIdForPath(
  pathname: string,
  sidebarResourceByPath: Record<string, string>,
): string | null {
  const normalized = pathname.split('?')[0].replace(/\/$/, '') || '/';
  const exact = sidebarResourceByPath[normalized];
  if (exact) {
    return exact;
  }
  const entries = Object.entries(sidebarResourceByPath).sort(([a], [b]) => b.length - a.length);
  for (const [path, resourceId] of entries) {
    if (normalized.startsWith(`${path}/`)) {
      return resourceId;
    }
  }
  return null;
}

export function isProtectedPath(
  pathname: string,
  sidebarResourceByPath: Record<string, string>,
): boolean {
  return resolveResourceIdForPath(pathname, sidebarResourceByPath) !== null;
}

export type TreeNodeWithState<T extends ResourceNode, N> = T & {
  state?: N;
  children?: TreeNodeWithState<T, N>[];
};

export function buildNodeTree<T extends ResourceNode, N extends { id: string }>(
  tree: T[],
  nodes: N[],
): TreeNodeWithState<T, N>[] {
  const stateById = new Map(nodes.map((n) => [n.id, n]));

  const attach = (node: T): TreeNodeWithState<T, N> => ({
    ...node,
    state: stateById.get(node.id),
    children: node.children?.map((child) => attach(child as T)),
  });

  return tree.map(attach);
}

export function sourceLabel(source: string): string {
  switch (source) {
    case 'super_admin':
      return 'Super admin';
    case 'role':
      return 'Role default';
    case 'override_allow':
      return 'Allowed (override)';
    case 'override_deny':
      return 'Denied (override)';
    case 'inherited_deny':
      return 'Denied (inherited)';
    default:
      return source;
  }
}
