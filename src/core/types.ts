/** domain → portal; page → nav section; tile → route/sidebar; block → in-page UI */
export type ResourceType = 'domain' | 'page' | 'tile' | 'block';

export interface ResourceNode {
  id: string;
  type: ResourceType;
  label: string;
  path?: string;
  children?: ResourceNode[];
}

export interface ResourceCatalogueConfig {
  tree: ResourceNode[];
  role_domain_grants: Record<string, string[]>;
  /** Optional sidebar href → catalogue resource id map for route guards */
  sidebar_resource_by_path?: Record<string, string>;
}

export interface FlatResourceNode {
  id: string;
  type: ResourceType;
  label: string;
  path?: string;
  parent_id: string | null;
  depth: number;
}

export type ResourceAccessSource =
  | 'super_admin'
  | 'role'
  | 'override_allow'
  | 'override_deny'
  | 'inherited_deny';

export type ResourceOverrideEffect = 'allow' | 'deny';

export interface ResourceAccessNodeState {
  id: string;
  type: ResourceType;
  label: string;
  path?: string;
  parent_id: string | null;
  depth: number;
  effective: boolean;
  source: ResourceAccessSource;
  has_override: boolean;
  override_effect: ResourceOverrideEffect | null;
}

export interface UserResourceAccessResponse {
  user: {
    id: string;
    email: string;
    role: string;
    roles?: string[];
  };
  tree: ResourceNode[];
  nodes: ResourceAccessNodeState[];
  allowed_resource_ids: string[];
  tenantId?: string;
}

export interface MyResourceAccessResponse {
  allowed_resource_ids: string[];
  /** Present when the host returns role metadata from /me */
  roles?: string[];
  isSuperAdmin?: boolean;
}

export interface ResourceAccessContext {
  userId: string;
  /** Optional tenant/org/clinic scope for overrides and role membership */
  tenantId?: string;
  /** Optional request hint; storage loads roles when omitted */
  roles?: string[];
}
