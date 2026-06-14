export declare enum ResourceOverrideEffect {
    ALLOW = "allow",
    DENY = "deny"
}
export declare class UserResourceOverride {
    id: number;
    user_id: string;
    resource_id: string;
    effect: ResourceOverrideEffect;
    created_at: Date;
    updated_at: Date;
}
