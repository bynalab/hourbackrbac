import type { FastifyInstance } from 'fastify';
import {
  ResourceAccessService,
  resolveServiceOptions,
} from '../server';
import { createPgResourceAccessStorage } from './pg-storage';
import { resolveFastifyOptions, type UiResourceAccessFastifyOptions } from './options';
import { registerUiResourceAccessRoutes } from './register-routes';
import { createRequireResource } from './require-resource';

export function createUiResourceAccess(options: UiResourceAccessFastifyOptions) {
  const resolved = resolveFastifyOptions(options);
  const storage =
    resolved.storage ??
    createPgResourceAccessStorage(resolved.pool!, resolved.userTable);
  const service = new ResourceAccessService(resolveServiceOptions(resolved), storage);

  const requireResource = createRequireResource(service, resolved.getContext);

  function registerRoutes(fastify: FastifyInstance): void {
    if (!resolved.registerRoutes) {
      return;
    }
    registerUiResourceAccessRoutes(fastify, service, resolved);
  }

  return {
    service,
    requireResource,
    registerRoutes,
  };
}

export type UiResourceAccessFastify = ReturnType<typeof createUiResourceAccess>;
