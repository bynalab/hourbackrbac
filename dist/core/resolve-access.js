"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildNodeState = buildNodeState;
exports.computeAllowedResourceIds = computeAllowedResourceIds;
exports.canAccessResource = canAccessResource;
exports.roleDefaultAllows = roleDefaultAllows;
const catalogue_1 = require("../core/catalogue");
function buildNodeState(role, node, overrides, config, godModeRoles) {
    const pathIds = (0, catalogue_1.getResourcePathIds)(node.id, config.tree);
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
    const domainId = (0, catalogue_1.getDomainIdForResource)(node.id, config.tree);
    let effective = domainId
        ? (0, catalogue_1.roleGrantsDomain)(role, domainId, config.role_domain_grants)
        : false;
    let source = effective ? 'role' : 'inherited_deny';
    for (const id of pathIds) {
        const override = overrides.get(id);
        if (override === 'deny') {
            effective = false;
            source = id === node.id ? 'override_deny' : 'inherited_deny';
        }
        else if (override === 'allow') {
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
function computeAllowedResourceIds(role, overrides, config, godModeRoles) {
    const tree = (0, catalogue_1.getCatalogueForRole)(role, config);
    const flat = (0, catalogue_1.flattenResourceTree)(tree);
    return flat
        .map((node) => buildNodeState(role, node, overrides, config, godModeRoles))
        .filter((n) => n.effective)
        .map((n) => n.id);
}
function canAccessResource(role, resourceId, overrides, config, godModeRoles) {
    const tree = (0, catalogue_1.getCatalogueForRole)(role, config);
    const flat = (0, catalogue_1.flattenResourceTree)(tree);
    const node = flat.find((n) => n.id === resourceId);
    if (!node) {
        return false;
    }
    return buildNodeState(role, node, overrides, config, godModeRoles).effective;
}
function roleDefaultAllows(role, resourceId, config, godModeRoles) {
    return canAccessResource(role, resourceId, new Map(), config, godModeRoles);
}
