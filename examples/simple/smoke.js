const { start, fastify, PORT } = require('./server');

const base = `http://127.0.0.1:${PORT}`;

async function req(method, path, { userId, body } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'x-user-id': userId,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function run() {
  await start();

  const me = await req('GET', '/resource-access/me', { userId: 'viewer-1' });
  assert(me.json.allowed_resource_ids.includes('reports.main'), 'Maya sees reports');
  assert(!me.json.allowed_resource_ids.includes('items.create'), 'Maya cannot create items');

  assert((await req('POST', '/reports/export', { userId: 'viewer-1' })).status === 200, 'Maya can export');
  assert((await req('POST', '/items', { userId: 'viewer-1' })).status === 403, 'Maya cannot create');

  const toggle = await req('PATCH', '/admin/resource-access/users/viewer-1/resource-access/toggle', {
    userId: 'admin-1',
    body: { resource_id: 'items.create', allowed: true },
  });
  assert(toggle.status === 200, `toggle failed ${toggle.status}`);
  assert((await req('POST', '/items', { userId: 'viewer-1' })).status === 200, 'Maya can create after grant');

  console.log('example smoke passed');
  await fastify.close();
}

run().catch(async (err) => {
  console.error(err);
  try { await fastify.close(); } catch { /* ignore */ }
  process.exit(1);
});
