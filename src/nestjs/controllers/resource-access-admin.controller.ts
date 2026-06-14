import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Put,
  Type,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResourceAccessService } from '../resource-access.service';
import { BatchResourceAccessDto, ToggleResourceAccessDto } from '../dto/resource-access.dto';
import { ResourceAccessAdminGuard } from '../resource-access-admin.guard';
import { RequireAdminRoles } from '../require-admin-roles.decorator';

export function createResourceAccessAdminController(
  controllerPath: string,
  authGuards: Type<unknown>[] = [],
  extraGuards: Type<unknown>[] = [],
): Type<unknown> {
  @ApiTags('Admin - Resource Access (RBAC v2)')
  @Controller(controllerPath)
  @UseGuards(...(authGuards as never[]), ResourceAccessAdminGuard, ...(extraGuards as never[]))
  @RequireAdminRoles()
  @ApiBearerAuth()
  class ResourceAccessAdminController {
    constructor(private readonly resourceAccessService: ResourceAccessService) {}

    @Get('resource-catalogue')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Resource tree (domains, pages, tiles, blocks)' })
    getResourceCatalogue() {
      return this.resourceAccessService.getCatalogue();
    }

    @Get('users/:userId/resource-access')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Effective resource access for a user (admin editor)' })
    getUserResourceAccess(@Param('userId') userId: string) {
      return this.resourceAccessService.getUserResourceAccess(userId);
    }

    @Put('users/:userId/resource-access/batch')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Batch update allow/deny overrides' })
    batchUpdateResourceAccess(
      @Param('userId') userId: string,
      @Body() dto: BatchResourceAccessDto,
    ) {
      return this.resourceAccessService.batchUpdateOverrides(userId, dto.items);
    }

    @Patch('users/:userId/resource-access/toggle')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Toggle a single resource allow/deny for a user' })
    toggleResourceAccess(
      @Param('userId') userId: string,
      @Body() dto: ToggleResourceAccessDto,
    ) {
      return this.resourceAccessService.toggleResourceAccess(
        userId,
        dto.resource_id,
        dto.allowed,
      );
    }
  }

  return ResourceAccessAdminController;
}
