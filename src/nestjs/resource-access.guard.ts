import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ResourceAccessService } from './resource-access.service';

export const REQUIRE_RESOURCE_KEY = 'require_resource';

@Injectable()
export class ResourceAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly resourceAccessService: ResourceAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resourceId = this.reflector.get<string>(
      REQUIRE_RESOURCE_KEY,
      context.getHandler(),
    );

    if (!resourceId) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('User not authenticated');
    }

    const allowed = await this.resourceAccessService.canAccessResourceForUser(
      user.id,
      resourceId,
    );

    if (!allowed) {
      throw new ForbiddenException(`Access denied for resource "${resourceId}"`);
    }

    return true;
  }
}
