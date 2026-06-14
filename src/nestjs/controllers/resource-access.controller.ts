import { Controller, Get, Inject, Request, Type, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResourceAccessService } from '../resource-access.service';
import { RESOURCE_ACCESS_OPTIONS, type ResourceAccessOptionsResolved } from '../options';

export function createResourceAccessController(
  authGuards: Type<unknown>[] = [],
): Type<unknown> {
  @ApiTags('Resource Access (RBAC v2)')
  @Controller('resource-access')
  @UseGuards(...(authGuards as never[]))
  @ApiBearerAuth()
  class ResourceAccessController {
    constructor(private readonly resourceAccessService: ResourceAccessService) {}

    @Get('me')
    @ApiOperation({ summary: 'Effective resource IDs for the current user' })
    @ApiResponse({ status: 200, description: 'Allowed catalogue resource IDs' })
    getMyAccess(@Request() req: { user: { id: string } }) {
      return this.resourceAccessService.getMyResourceAccess(req.user.id);
    }
  }

  return ResourceAccessController;
}
