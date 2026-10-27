export { createUiResourceAccess, type UiResourceAccessFastify } from './create-ui-resource-access';
export { registerUiResourceAccessRoutes } from './register-routes';
export { createRequireResource, createRequireAdminRoles } from './require-resource';
export { createPgResourceAccessStorage, type PgUserTableConfig } from './pg-storage';
export { createPgMultiRoleStorage, type PgMultiRoleStorageConfig } from './pg-multi-role-storage';
export {
  resolveFastifyOptions,
  type UiResourceAccessFastifyOptions,
  type UiResourceAccessFastifyOptionsResolved,
} from './options';
