import { ResourceAccessService } from '../resource-access.service';
import { resolveServiceOptions } from '../options';
import type { ResourceAccessStorage } from '../storage';
import type { ResourceAccessContext } from '../../core/types';
import type { ResourceCatalogueConfig } from '../../core/types';

const CATALOGUE: ResourceCatalogueConfig = {
  tree: [
    {
      id: 'tenant',
      type: 'domain',
      label: 'Tenant',
      children: [{ id: 'tenant.items', type: 'tile', label: 'Items', path: '/items' }],
    },
  ],
  role_domain_grants: {
    clinician: ['tenant'],
    billing: ['tenant'],
  },
};

describe('ResourceAccessService multi-role & tenant', () => {
  const tenantA = 'tenant-a';
  const tenantB = 'tenant-b';
  const overridesByTenant = new Map<string, Map<string, 'allow' | 'deny'>>();

  const storage: ResourceAccessStorage = {
    findUser: jest.fn(async () => ({
      id: 'user-1',
      email: 'user@test.com',
      role: 'clinician',
    })),
    getUserRoles: jest.fn(async (ctx: ResourceAccessContext) => {
      if (ctx.tenantId === tenantA) return ['clinician', 'billing'];
      return ['clinician'];
    }),
    loadOverrideMap: jest.fn(async (ctx: ResourceAccessContext) => {
      const key = ctx.tenantId ?? 'global';
      return new Map(overridesByTenant.get(key) ?? []);
    }),
    deleteOverride: jest.fn(async (ctx, resourceId) => {
      const key = ctx.tenantId ?? 'global';
      overridesByTenant.get(key)?.delete(resourceId);
    }),
    upsertOverride: jest.fn(async (ctx, resourceId, effect) => {
      const key = ctx.tenantId ?? 'global';
      if (!overridesByTenant.has(key)) {
        overridesByTenant.set(key, new Map());
      }
      overridesByTenant.get(key)!.set(resourceId, effect);
    }),
  };

  let service: ResourceAccessService;

  beforeEach(() => {
    overridesByTenant.clear();
    service = new ResourceAccessService(
      resolveServiceOptions({ catalogue: CATALOGUE, godModeRoles: ['super_admin'] }),
      storage,
    );
  });

  it('unions roles for /me in a tenant', async () => {
    const me = await service.getMyResourceAccess({ userId: 'user-1', tenantId: tenantA });
    expect(me.roles).toEqual(['clinician', 'billing']);
    expect(me.allowed_resource_ids).toContain('tenant.items');
  });

  it('isolates overrides per tenantId', async () => {
    overridesByTenant.set(tenantA, new Map([['tenant.items', 'deny']]));
    overridesByTenant.set(tenantB, new Map());

    const denied = await service.canAccessResourceForContext(
      { userId: 'user-1', tenantId: tenantA },
      'tenant.items',
    );
    const allowed = await service.canAccessResourceForContext(
      { userId: 'user-1', tenantId: tenantB },
      'tenant.items',
    );

    expect(denied).toBe(false);
    expect(allowed).toBe(true);
  });

  it('requireResource path matches /me for the same context', async () => {
    overridesByTenant.set(tenantA, new Map([['tenant.items', 'deny']]));

    const me = await service.getMyResourceAccess({ userId: 'user-1', tenantId: tenantA });
    const guard = await service.canAccessResourceForContext(
      { userId: 'user-1', tenantId: tenantA },
      'tenant.items',
    );

    expect(me.allowed_resource_ids.includes('tenant.items')).toBe(guard);
  });

  it('clears descendant overrides when enabling a parent', async () => {
    overridesByTenant.set(
      tenantA,
      new Map([
        ['tenant.items', 'deny'],
        ['tenant', 'deny'],
      ]),
    );

    await service.toggleResourceAccess(
      { userId: 'user-1', tenantId: tenantA },
      'tenant',
      true,
    );

    const map = overridesByTenant.get(tenantA)!;
    expect(map.has('tenant.items')).toBe(false);
  });
});
