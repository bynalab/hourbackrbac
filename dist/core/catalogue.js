"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenResourceTree = flattenResourceTree;
exports.getResourcePathIds = getResourcePathIds;
exports.getDomainIdForResource = getDomainIdForResource;
exports.roleGrantsDomain = roleGrantsDomain;
exports.getCatalogueForRole = getCatalogueForRole;
exports.resolveResourceIdForPath = resolveResourceIdForPath;
exports.isProtectedPath = isProtectedPath;
exports.buildNodeTree = buildNodeTree;
exports.sourceLabel = sourceLabel;
function flattenResourceTree(nodes, parentId = null, depth = 0) {
    const result = [];
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
function getResourcePathIds(resourceId, tree) {
    const flat = flattenResourceTree(tree);
    const byId = new Map(flat.map((n) => [n.id, n]));
    const path = [];
    let current = byId.get(resourceId);
    while (current) {
        path.unshift(current.id);
        current = current.parent_id ? byId.get(current.parent_id) : undefined;
    }
    return path;
}
function getDomainIdForResource(resourceId, tree) {
    const path = getResourcePathIds(resourceId, tree);
    return path[0] ?? null;
}
function roleGrantsDomain(role, domainId, roleDomainGrants) {
    const grants = roleDomainGrants[role] ?? [];
    if (grants.includes('*')) {
        return true;
    }
    return grants.includes(domainId);
}
function getCatalogueForRole(role, config) {
    const { tree, role_domain_grants: roleDomainGrants } = config;
    if (roleDomainGrants[role]?.includes('*')) {
        return tree;
    }
    const granted = new Set(roleDomainGrants[role] ?? []);
    return tree.filter((node) => granted.has(node.id));
}
function resolveResourceIdForPath(pathname, sidebarResourceByPath) {
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
function isProtectedPath(pathname, sidebarResourceByPath) {
    return resolveResourceIdForPath(pathname, sidebarResourceByPath) !== null;
}
function buildNodeTree(tree, nodes) {
    const stateById = new Map(nodes.map((n) => [n.id, n]));
    const attach = (node) => ({
        ...node,
        state: stateById.get(node.id),
        children: node.children?.map((child) => attach(child)),
    });
    return tree.map(attach);
}
function sourceLabel(source) {
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
