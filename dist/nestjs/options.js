"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESOURCE_ACCESS_OPTIONS = void 0;
exports.resolveOptions = resolveOptions;
exports.RESOURCE_ACCESS_OPTIONS = 'RESOURCE_ACCESS_OPTIONS';
function resolveOptions(options) {
    return {
        ...options,
        godModeRoles: options.godModeRoles ?? ['super_admin'],
        adminRoles: options.adminRoles ?? ['super_admin'],
        adminControllerPath: options.adminControllerPath ?? 'admin/resource-access',
        registerControllers: options.registerControllers !== false,
    };
}
