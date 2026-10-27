import type {
  FlatResourceNode,
  ResourceAccessNodeState,
  ResourceAccessSource,
  ResourceCatalogueConfig,
  ResourceOverrideEffect,
} from './types';
import {
  flattenResourceTree,
  getDomainIdForResource,
  getResourcePathIds,
  roleGrantsDomain,
} from './catalogue';

function applyOverridePath(
  pathIds: string[],
  nodeId: string,
  overrides: Map<string, ResourceOverrideEffect>,
  roleEffective: boolean,
): { effective: boolean; source: ResourceAccessSource } {
  let effective = roleEffective;
  let source: ResourceAccessSource = effective ? 'role' : 'inherited_deny';

  for (const id of pathIds) {
    const override = overrides.get(id);
    if (override === 'deny') {
      effective = false;
      source = id === nodeId ? 'override_deny' : 'inherited_deny';
    } else if (override === 'allow') {
      effective = true;
      source = id === nodeId ? 'override_allow' : 'override_allow';
    }
  }

  return { effective, source };
}

export function buildNodeStateMultiRole(
  roles: string[],
  node: FlatResourceNode,
  overrides: Map<string, ResourceOverrideEffect>,
  config: ResourceCatalogueConfig,
  godModeRoles: string[],
): ResourceAccessNodeState {
  const pathIds = getResourcePathIds(node.id, config.tree);
  const directOverride = overrides.get(node.id) ?? null;

  if (roles.some((role) => godModeRoles.includes(role))) {
    return {
      ...node,
      effective: true,
      source: 'super_admin',
      has_override: directOverride !== null,
      override_effect: directOverride,
    };
  }

  const domainId = getDomainIdForResource(node.id, config.tree);
  const roleEffective = domainId
    ? roles.some((role) => roleGrantsDomain(role, domainId, config.role_domain_grants))
    : false;

  const { effective, source } = applyOverridePath(
    pathIds,
    node.id,
    overrides,
    roleEffective,
  );

  return {
    ...node,
    effective,
    source,
    has_override: directOverride !== null,
    override_effect: directOverride,
  };
}

export function buildNodeState(
  role: string,
  node: FlatResourceNode,
  overrides: Map<string, ResourceOverrideEffect>,
  config: ResourceCatalogueConfig,
  godModeRoles: string[],
): ResourceAccessNodeState {
  return buildNodeStateMultiRole([role], node, overrides, config, godModeRoles);
}

export function computeAllowedResourceIdsMultiRole(
  roles: string[],
  overrides: Map<string, ResourceOverrideEffect>,
  config: ResourceCatalogueConfig,
  godModeRoles: string[],
): string[] {
  const flat = flattenResourceTree(config.tree);
  return flat
    .map((node) => buildNodeStateMultiRole(roles, node, overrides, config, godModeRoles))
    .filter((n) => n.effective)
    .map((n) => n.id);
}

export function computeAllowedResourceIds(
  role: string,
  overrides: Map<string, ResourceOverrideEffect>,
  config: ResourceCatalogueConfig,
  godModeRoles: string[],
): string[] {
  return computeAllowedResourceIdsMultiRole([role], overrides, config, godModeRoles);
}

export function canAccessResourceMultiRole(
  roles: string[],
  resourceId: string,
  overrides: Map<string, ResourceOverrideEffect>,
  config: ResourceCatalogueConfig,
  godModeRoles: string[],
): boolean {
  const flat = flattenResourceTree(config.tree);
  const node = flat.find((n) => n.id === resourceId);
  if (!node) {
    return false;
  }
  return buildNodeStateMultiRole(roles, node, overrides, config, godModeRoles).effective;
}

export function canAccessResource(
  role: string,
  resourceId: string,
  overrides: Map<string, ResourceOverrideEffect>,
  config: ResourceCatalogueConfig,
  godModeRoles: string[],
): boolean {
  return canAccessResourceMultiRole([role], resourceId, overrides, config, godModeRoles);
}

export function rolesDefaultAllow(
  roles: string[],
  resourceId: string,
  config: ResourceCatalogueConfig,
  godModeRoles: string[],
): boolean {
  return canAccessResourceMultiRole(roles, resourceId, new Map(), config, godModeRoles);
}

export function roleDefaultAllows(
  role: string,
  resourceId: string,
  config: ResourceCatalogueConfig,
  godModeRoles: string[],
): boolean {
  return rolesDefaultAllow([role], resourceId, config, godModeRoles);
}
