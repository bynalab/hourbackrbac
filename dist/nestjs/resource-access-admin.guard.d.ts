import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type ResourceAccessOptionsResolved } from './options';
/** Simple role check for admin endpoints — no CASL dependency. */
export declare class ResourceAccessAdminGuard implements CanActivate {
    private readonly reflector;
    private readonly options;
    constructor(reflector: Reflector, options: ResourceAccessOptionsResolved);
    canActivate(context: ExecutionContext): boolean;
}
