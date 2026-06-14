import { SetMetadata } from '@nestjs/common';
import { REQUIRE_RESOURCE_KEY } from './resource-access.guard';

export { REQUIRE_RESOURCE_KEY };

/**
 * RBAC v2 — require catalogue resource access (same rules as UI `<CanAccess>`).
 */
export const RequireResource = (resourceId: string) =>
  SetMetadata(REQUIRE_RESOURCE_KEY, resourceId);
