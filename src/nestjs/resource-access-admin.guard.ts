import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_ADMIN_ROLES_KEY } from './require-admin-roles.decorator';
import { RESOURCE_ACCESS_OPTIONS, type ResourceAccessOptionsResolved } from './options';

/** Simple role check for admin endpoints — no CASL dependency. */
@Injectable()
export class ResourceAccessAdminGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(RESOURCE_ACCESS_OPTIONS)
    private readonly options: ResourceAccessOptionsResolved,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const metadataRoles = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_ADMIN_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    // @RequireAdminRoles() with no args sets [] — treat as "use module defaults"
    const requiredRoles =
      metadataRoles && metadataRoles.length > 0
        ? metadataRoles
        : this.options.adminRoles;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
