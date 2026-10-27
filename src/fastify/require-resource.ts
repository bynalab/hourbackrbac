import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import type { ResourceAccessContext } from '../core/types';
import type { ResourceAccessService } from '../server';

export function createRequireResource(
  service: ResourceAccessService,
  getContext: (req: FastifyRequest) => ResourceAccessContext | null | undefined,
) {
  return function requireResource(resourceId: string): preHandlerHookHandler {
    return async (req: FastifyRequest, reply: FastifyReply) => {
      const ctx = getContext(req);
      if (!ctx?.userId) {
        return reply.code(403).send({
          statusCode: 403,
          message: 'User not authenticated',
          error: 'Forbidden',
        });
      }

      const allowed = await service.canAccessResourceForContext(ctx, resourceId);
      if (!allowed) {
        return reply.code(403).send({
          statusCode: 403,
          message: `Access denied for resource "${resourceId}"`,
          error: 'Forbidden',
        });
      }
    };
  };
}

export function createRequireAdminRoles(
  adminRoles: string[],
  getContext: (req: FastifyRequest) => ResourceAccessContext | null | undefined,
  service: ResourceAccessService,
): preHandlerHookHandler {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = getContext(req);
    if (!ctx?.userId) {
      return reply.code(403).send({
        statusCode: 403,
        message: 'User not authenticated',
        error: 'Forbidden',
      });
    }

    const roles = await service.getRolesForContext(ctx);
    if (!roles.some((role) => adminRoles.includes(role))) {
      return reply.code(403).send({
        statusCode: 403,
        message: 'Insufficient permissions',
        error: 'Forbidden',
      });
    }
  };
}

function targetContext(
  ctx: ResourceAccessContext,
  targetUserId: string,
): ResourceAccessContext {
  return {
    userId: targetUserId,
    tenantId: ctx.tenantId,
  };
}

export { targetContext };
