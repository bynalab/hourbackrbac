export type { ResourceAccessContext, ResourceOverrideEffect } from '../core/types';

export interface ResourceAccessUser {
  id: string;
  email: string;
  role: string;
  is_deleted?: boolean;
}
