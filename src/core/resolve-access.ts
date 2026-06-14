import type {
  FlatResourceNode,
  ResourceAccessNodeState,
  ResourceAccessSource,
  ResourceCatalogueConfig,
  ResourceOverrideEffect,
} from '../core/types';
import {
  flattenResourceTree,
  getCatalogueForRole,
  getDomainIdForResource,
  getResourcePathIds,
  roleGrantsDomain,
} from '../core/catalogue';

export function buildNodeState(
  role: string,
  node: FlatResourceNode,
  overrides: Map<string, ResourceOverrideEffect>,
  config: ResourceCatalogueConfig,
  godModeRoles: string[],
): ResourceAccessNodeState {
  const pathIds = getResourcePathIds(node.id, config.tree);
  const directOverride = overrides.get(node.id) ?? null;

  if (godModeRoles.includes(role)) {
    return {
      ...node,
      effective: true,
      source: 'super_admin',
      has_override: directOverride !== null,
      override_effect: directOverride,
    };
  }

  const domainId = getDomainIdForResource(node.id, config.tree);
  let effective = domainId
    ? roleGrantsDomain(role, domainId, config.role_domain_grants)
    : false;
  let source: ResourceAccessSource = effective ? 'role' : 'inherited_deny';

  for (const id of pathIds) {
    const override = overrides.get(id);
    if (override === 'deny') {
      effective = false;
      source = id === node.id ? 'override_deny' : 'inherited_deny';
    } else if (override === 'allow') {
      effective = true;
      source = id === node.id ? 'override_allow' : 'override_allow';
    }
  }

  return {
    ...node,
    effective,
    source,
    has_override: directOverride !== null,
    override_effect: directOverride,
  };
}

export function computeAllowedResourceIds(
  role: string,
  overrides: Map<string, ResourceOverrideEffect>,
  config: ResourceCatalogueConfig,
  godModeRoles: string[],
): string[] {
  const tree = getCatalogueForRole(role, config);
  const flat = flattenResourceTree(tree);
  return flat
    .map((node) => buildNodeState(role, node, overrides, config, godModeRoles))
    .filter((n) => n.effective)
    .map((n) => n.id);
}

export function canAccessResource(
  role: string,
  resourceId: string,
  overrides: Map<string, ResourceOverrideEffect>,
  config: ResourceCatalogueConfig,
  godModeRoles: string[],
): boolean {
  const tree = getCatalogueForRole(role, config);
  const flat = flattenResourceTree(tree);
  const node = flat.find((n) => n.id === resourceId);
  if (!node) {
    return false;
  }
  return buildNodeState(role, node, overrides, config, godModeRoles).effective;
}

export function roleDefaultAllows(
  role: string,
  resourceId: string,
  config: ResourceCatalogueConfig,
  godModeRoles: string[],
): boolean {
  return canAccessResource(role, resourceId, new Map(), config, godModeRoles);
}
