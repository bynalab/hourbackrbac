import type { FastifyInstance } from 'fastify';
import type { ResourceAccessService } from '../server';
import { sendResourceAccessError } from './errors';
import type { UiResourceAccessFastifyOptionsResolved } from './options';
import { createRequireAdminRoles, targetContext } from './require-resource';
import { ResourceOverrideEffect } from '../core/types';

function joinRoute(prefix: string, path: string): string {
  const base = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function registerUiResourceAccessRoutes(
  fastify: FastifyInstance,
  service: ResourceAccessService,
  options: UiResourceAccessFastifyOptionsResolved,
): void {
  const authHandlers = options.preHandlers ?? [];
  const requireAdmin = createRequireAdminRoles(options.adminRoles, options.getContext, service);
  const adminHandlers = [...authHandlers, requireAdmin, ...(options.adminPreHandlers ?? [])];
  const prefix = options.routePrefix;

  fastify.get(
    joinRoute(prefix, '/resource-access/me'),
    { preHandler: authHandlers },
    async (req, reply) => {
      const ctx = options.getContext(req);
      if (!ctx?.userId) {
        return reply.code(403).send({
          statusCode: 403,
          message: 'User not authenticated',
          error: 'Forbidden',
        });
      }

      try {
        return await service.getMyResourceAccess(ctx);
      } catch (error) {
        sendResourceAccessError(reply, error);
      }
    },
  );

  fastify.get(
    joinRoute(prefix, `/${options.adminControllerPath}/resource-catalogue`),
    { preHandler: adminHandlers },
    async (_req, reply) => {
      try {
        return service.getCatalogue();
      } catch (error) {
        sendResourceAccessError(reply, error);
      }
    },
  );

  fastify.get(
    joinRoute(prefix, `/${options.adminControllerPath}/users/:userId/resource-access`),
    { preHandler: adminHandlers },
    async (req, reply) => {
      const ctx = options.getContext(req);
      const { userId } = req.params as { userId: string };
      if (!ctx?.userId) {
        return reply.code(403).send({ statusCode: 403, message: 'Forbidden', error: 'Forbidden' });
      }

      try {
        return await service.getUserResourceAccess(targetContext(ctx, userId));
      } catch (error) {
        sendResourceAccessError(reply, error);
      }
    },
  );

  fastify.put(
    joinRoute(prefix, `/${options.adminControllerPath}/users/:userId/resource-access/batch`),
    { preHandler: adminHandlers },
    async (req, reply) => {
      const ctx = options.getContext(req);
      const { userId } = req.params as { userId: string };
      const body = req.body as {
        items?: Array<{ resource_id: string; effect: ResourceOverrideEffect | null }>;
      };

      if (!ctx?.userId) {
        return reply.code(403).send({ statusCode: 403, message: 'Forbidden', error: 'Forbidden' });
      }

      try {
        return await service.batchUpdateOverrides(targetContext(ctx, userId), body.items ?? []);
      } catch (error) {
        sendResourceAccessError(reply, error);
      }
    },
  );

  fastify.patch(
    joinRoute(prefix, `/${options.adminControllerPath}/users/:userId/resource-access/toggle`),
    { preHandler: adminHandlers },
    async (req, reply) => {
      const ctx = options.getContext(req);
      const { userId } = req.params as { userId: string };
      const body = req.body as { resource_id?: string; allowed?: boolean };

      if (!ctx?.userId) {
        return reply.code(403).send({ statusCode: 403, message: 'Forbidden', error: 'Forbidden' });
      }

      if (!body.resource_id || typeof body.allowed !== 'boolean') {
        return reply.code(400).send({
          statusCode: 400,
          message: 'resource_id and allowed are required',
          error: 'Bad Request',
        });
      }

      try {
        return await service.toggleResourceAccess(
          targetContext(ctx, userId),
          body.resource_id,
          body.allowed,
        );
      } catch (error) {
        sendResourceAccessError(reply, error);
      }
    },
  );
}
