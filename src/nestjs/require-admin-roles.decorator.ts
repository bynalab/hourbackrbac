import { SetMetadata } from '@nestjs/common';

export const REQUIRE_ADMIN_ROLES_KEY = 'require_admin_roles';

/** When called with no roles, module `adminRoles` from options apply (see guard). */
export const RequireAdminRoles = (...roles: string[]) =>
  roles.length > 0 ? SetMetadata(REQUIRE_ADMIN_ROLES_KEY, roles) : () => {};
