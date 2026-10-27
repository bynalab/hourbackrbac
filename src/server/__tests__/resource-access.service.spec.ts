import { ResourceAccessService } from '../resource-access.service';
import { resolveServiceOptions } from '../options';
import type { ResourceAccessStorage } from '../storage';
import type { ResourceCatalogueConfig } from '../../core/types';

const TEST_CATALOGUE: ResourceCatalogueConfig = {
  tree: [
    {
      id: 'manufacturer',
      type: 'domain',
      label: 'Manufacturer',
      children: [
        {
          id: 'manufacturer.production',
          type: 'page',
          label: 'Production',
          children: [
            {
              id: 'manufacturer.batches',
              type: 'tile',
              label: 'Batches',
              path: '/manufacturer/batches',
              children: [
                {
                  id: 'manufacturer.batches.actions.create',
                  type: 'block',
                  label: 'Create Batch',
                },
              ],
            },
            {
              id: 'manufacturer.cases',
              type: 'tile',
              label: 'Cases',
              path: '/manufacturer/cases',
            },
          ],
        },
        {
          id: 'manufacturer.shipments',
          type: 'page',
          label: 'Shipments',
          children: [
            {
              id: 'manufacturer.shipments.list',
              type: 'tile',
              label: 'List Shipments',
              path: '/manufacturer/shipments',
            },
          ],
        },
      ],
    },
  ],
  role_domain_grants: {
    super_admin: ['*'],
    manufacturer: ['manufacturer'],
  },
};

describe('ResourceAccessService (Unit)', () => {
  let service: ResourceAccessService;
  let overrides = new Map<string, 'allow' | 'deny'>();

  const mockUser = {
    id: 'user-1',
    email: 'mfg@test.ke',
    role: 'manufacturer',
    is_deleted: false,
  };

  let currentUser = mockUser;

  const storage: ResourceAccessStorage = {
    findUser: jest.fn(async () => currentUser),
    getUserRoles: jest.fn(async () => (currentUser.role ? [currentUser.role] : [])),
    loadOverrideMap: jest.fn(async () => new Map(overrides)),
    deleteOverride: jest.fn(async (_ctx, resourceId) => {
      overrides.delete(resourceId);
    }),
    upsertOverride: jest.fn(async (_ctx, resourceId, effect) => {
      overrides.set(resourceId, effect);
    }),
  };

  beforeEach(() => {
    overrides = new Map();
    currentUser = mockUser;
    jest.clearAllMocks();
    service = new ResourceAccessService(
      resolveServiceOptions({
        catalogue: TEST_CATALOGUE,
        godModeRoles: ['super_admin'],
        adminRoles: ['super_admin'],
      }),
      storage,
    );
  });

  it('grants manufacturer tree nodes for manufacturer role by default', async () => {
    const result = await service.getUserResourceAccess('user-1');

    expect(result.allowed_resource_ids).toContain('manufacturer.batches');
    expect(result.allowed_resource_ids).toContain('manufacturer.shipments.list');
    expect(result.nodes.find((n) => n.id === 'manufacturer.batches')?.effective).toBe(true);
  });

  it('applies deny override on a tile', async () => {
    overrides.set('manufacturer.batches', 'deny');

    const result = await service.getUserResourceAccess('user-1');
    expect(result.nodes.find((n) => n.id === 'manufacturer.batches')?.effective).toBe(false);
    expect(result.allowed_resource_ids).not.toContain('manufacturer.batches');
  });

  it('inherits deny from parent page to child tiles', async () => {
    overrides.set('manufacturer.production', 'deny');

    const result = await service.getUserResourceAccess('user-1');
    expect(result.nodes.find((n) => n.id === 'manufacturer.batches')?.effective).toBe(false);
    expect(result.nodes.find((n) => n.id === 'manufacturer.cases')?.effective).toBe(false);
    expect(result.nodes.find((n) => n.id === 'manufacturer.shipments.list')?.effective).toBe(true);
  });

  it('super_admin has all resources effective', async () => {
    currentUser = { ...mockUser, role: 'super_admin' };
    const result = await service.getUserResourceAccess('user-1');
    expect(result.nodes.every((n) => n.effective)).toBe(true);
  });

  it('rejects toggle overrides for super_admin', async () => {
    currentUser = { ...mockUser, role: 'super_admin' };
    await expect(
      service.toggleResourceAccess('user-1', 'manufacturer.batches', false),
    ).rejects.toThrow('Resource access overrides do not apply to super_admin users');
  });

  it('canAccessResourceForUser respects deny on block', async () => {
    overrides.set('manufacturer.batches.actions.create', 'deny');

    const allowed = await service.canAccessResourceForUser(
      'user-1',
      'manufacturer.batches.actions.create',
    );
    expect(allowed).toBe(false);
  });
});
