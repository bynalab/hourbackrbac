export declare const REQUIRE_ADMIN_ROLES_KEY = "require_admin_roles";
/** When called with no roles, module `adminRoles` from options apply (see guard). */
export declare const RequireAdminRoles: (...roles: string[]) => import("@nestjs/common").CustomDecorator<string> | (() => void);
