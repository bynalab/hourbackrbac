import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ResourceAccessService } from './resource-access.service';
export declare const REQUIRE_RESOURCE_KEY = "require_resource";
export declare class ResourceAccessGuard implements CanActivate {
    private readonly reflector;
    private readonly resourceAccessService;
    constructor(reflector: Reflector, resourceAccessService: ResourceAccessService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
