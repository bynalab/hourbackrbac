import { Repository } from 'typeorm';
import type { MyResourceAccessResponse, ResourceAccessNodeState, UserResourceAccessResponse } from '../core/types';
import { ResourceOverrideEffect, UserResourceOverride } from './entity/user-resource-override.entity';
import { type ResourceAccessOptionsResolved } from './options';
interface UserRecord {
    id: string;
    email: string;
    role: string;
    is_deleted?: boolean;
}
export declare class ResourceAccessService {
    private readonly options;
    private readonly overrideRepository;
    private readonly userRepository;
    constructor(options: ResourceAccessOptionsResolved, overrideRepository: Repository<UserResourceOverride>, userRepository: Repository<UserRecord>);
    getCatalogue(): {
        tree: import("../core/types").ResourceNode[];
    };
    getUserResourceAccess(userId: string): Promise<UserResourceAccessResponse>;
    getMyResourceAccess(userId: string): Promise<MyResourceAccessResponse>;
    canAccess(role: string, resourceId: string, overrides: Map<string, ResourceOverrideEffect>): boolean;
    canAccessResourceForUser(userId: string, resourceId: string): Promise<boolean>;
    batchUpdateOverrides(userId: string, items: Array<{
        resource_id: string;
        effect: ResourceOverrideEffect | null;
    }>): Promise<UserResourceAccessResponse>;
    toggleResourceAccess(userId: string, resourceId: string, allowed: boolean): Promise<UserResourceAccessResponse>;
    private assertResourceAccessEditable;
    private findUser;
    private loadOverrideMap;
}
export type { ResourceAccessNodeState };
