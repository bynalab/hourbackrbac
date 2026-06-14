export { configureResourceAccess, getResourceAccessConfig, isResourceAccessConfigured } from './configure';
export type { ResourceAccessClientConfig } from './configure';
export {
  ResourceAccessProvider,
  useResourceAccess,
  useMemoizedSidebarFilter,
  type CanAccessPathOptions,
  type ResourceAccessContextValue,
} from './use-resource-access';
export { CanAccess } from './CanAccess';
export type { CanAccessProps } from './CanAccess';
export { ResourceAccessGuard } from './ResourceAccessGuard';
export {
  resolveResourceIdForPath,
  isProtectedPath,
  buildNodeTree,
  sourceLabel,
} from '../core/catalogue';
export type {
  ResourceNode,
  ResourceAccessNodeState,
  UserResourceAccessResponse,
} from '../core/types';
