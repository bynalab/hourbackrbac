import { ResourceOverrideEffect } from '../entity/user-resource-override.entity';
export declare class BatchResourceAccessItemDto {
    resource_id: string;
    effect: ResourceOverrideEffect | null;
}
export declare class BatchResourceAccessDto {
    items: BatchResourceAccessItemDto[];
}
export declare class ToggleResourceAccessDto {
    resource_id: string;
    allowed: boolean;
}
