"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireAdminRoles = exports.REQUIRE_ADMIN_ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.REQUIRE_ADMIN_ROLES_KEY = 'require_admin_roles';
/** When called with no roles, module `adminRoles` from options apply (see guard). */
const RequireAdminRoles = (...roles) => roles.length > 0 ? (0, common_1.SetMetadata)(exports.REQUIRE_ADMIN_ROLES_KEY, roles) : () => { };
exports.RequireAdminRoles = RequireAdminRoles;
