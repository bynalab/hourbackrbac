import { Controller, Get, Request, Type, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResourceAccessService } from '../resource-access.service';

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
    getMyAccess(@Request() req: { user?: { id?: string; role?: string } }) {
      return this.resourceAccessService.getMyResourceAccess(
        this.resourceAccessService.resolveContext(req),
      );
    }
  }

  return ResourceAccessController;
}
