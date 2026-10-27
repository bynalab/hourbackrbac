import type { FastifyReply } from 'fastify';
import {
  ResourceAccessBadRequestError,
  ResourceAccessNotFoundError,
} from '../server';

export function sendResourceAccessError(reply: FastifyReply, error: unknown): void {
  if (error instanceof ResourceAccessNotFoundError) {
    reply.code(404).send({ statusCode: 404, message: error.message, error: 'Not Found' });
    return;
  }
  if (error instanceof ResourceAccessBadRequestError) {
    reply.code(400).send({ statusCode: 400, message: error.message, error: 'Bad Request' });
    return;
  }

  throw error;
}
