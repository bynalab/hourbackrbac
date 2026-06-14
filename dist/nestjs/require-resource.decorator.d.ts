import { REQUIRE_RESOURCE_KEY } from './resource-access.guard';
export { REQUIRE_RESOURCE_KEY };
/**
 * RBAC v2 — require catalogue resource access (same rules as UI `<CanAccess>`).
 */
export declare const RequireResource: (resourceId: string) => import("@nestjs/common").CustomDecorator<string>;
