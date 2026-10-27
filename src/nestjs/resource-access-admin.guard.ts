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
import { ResourceAccessService } from './resource-access.service';

/** Simple role check for admin endpoints — supports multi-role via getContextFromRequest. */
@Injectable()
export class ResourceAccessAdminGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(RESOURCE_ACCESS_OPTIONS)
    private readonly options: ResourceAccessOptionsResolved,
    private readonly resourceAccessService: ResourceAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadataRoles = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_ADMIN_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredRoles =
      metadataRoles && metadataRoles.length > 0
        ? metadataRoles
        : this.options.adminRoles;

    const request = context.switchToHttp().getRequest();
    const ctx = this.resourceAccessService.resolveContext(request);
    const roles = await this.resourceAccessService.getRolesForRequest(ctx);

    if (!roles.some((role) => requiredRoles.includes(role))) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
