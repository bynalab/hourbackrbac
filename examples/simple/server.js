/**
 * Demo host: catalogue tree editor + login-as-user preview.
 *   npm run example  →  http://localhost:3456
 */
const path = require('path');
const fs = require('fs');
const Fastify = require('fastify');
const { createUiResourceAccess } = require('../../dist/fastify');
const { APP_CATALOGUE } = require('./catalogue');
const { createMemoryStorage } = require('./memory-storage');

const PORT = Number(process.env.PORT || 3456);

const USERS = {
  'viewer-1': { id: 'viewer-1', email: 'maya@clinic.test', role: 'viewer', name: 'Maya' },
  'editor-1': { id: 'editor-1', email: 'sam@clinic.test', role: 'editor', name: 'Sam' },
  'admin-1': { id: 'admin-1', email: 'alex@clinic.test', role: 'admin', name: 'Alex' },
};

const rolesByUserTenant = {
  'viewer-1': ['viewer'],
  'editor-1': ['editor'],
  'admin-1': ['admin'],
};

const storage = createMemoryStorage({ users: USERS, rolesByUserTenant });
const fastify = Fastify({ logger: false });

fastify.decorateRequest('user', null);

fastify.addHook('preHandler', async (req) => {
  const userId = req.headers['x-user-id'];
  req.user = typeof userId === 'string' ? USERS[userId] : undefined;
});

async function authenticate(req, reply) {
  if (!req.user?.id) {
    return reply.code(401).send({ statusCode: 401, message: 'Not logged in', error: 'Unauthorized' });
  }
}

const resourceAccess = createUiResourceAccess({
  catalogue: APP_CATALOGUE,
  storage,
  godModeRoles: ['super_admin'],
  adminRoles: ['admin', 'super_admin'],
  preHandlers: [authenticate],
  getContext: (req) => (req.user?.id ? { userId: req.user.id } : null),
});

resourceAccess.registerRoutes(fastify);

fastify.get('/', async (_req, reply) => {
  const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  return reply.type('text/html').send(html);
});

fastify.get('/demo/users', async () =>
  Object.values(USERS).map(({ id, name, role }) => ({ id, name, role })),
);

fastify.post(
  '/reports/export',
  { preHandler: [authenticate, resourceAccess.requireResource('reports.export')] },
  async () => ({ ok: true, message: 'Report exported' }),
);

fastify.post(
  '/items',
  { preHandler: [authenticate, resourceAccess.requireResource('items.create')] },
  async () => ({ ok: true, message: 'Item created' }),
);

fastify.post(
  '/items/delete',
  { preHandler: [authenticate, resourceAccess.requireResource('items.delete')] },
  async () => ({ ok: true, message: 'Item deleted' }),
);

async function start() {
  await fastify.listen({ port: PORT, host: '127.0.0.1' });
  console.log(`Demo: http://127.0.0.1:${PORT}`);
}

module.exports = { start, fastify, PORT, USERS };

if (require.main === module) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
