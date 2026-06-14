import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResourceAccessService } from '../resource-access.service';
import { UserResourceOverride, ResourceOverrideEffect } from '../entity/user-resource-override.entity';
import { RESOURCE_ACCESS_OPTIONS } from '../options';
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

  const mockUser = {
    id: 'user-1',
    email: 'mfg@test.ke',
    role: 'manufacturer',
    is_deleted: false,
  };

  const userRepo = { findOne: jest.fn() };
  const overrideRepo = {
    find: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
  };

  const resolvedOptions = {
    catalogue: TEST_CATALOGUE,
    godModeRoles: ['super_admin'],
    adminRoles: ['super_admin'],
    adminControllerPath: 'admin/rbac',
    registerControllers: true,
    userEntity: class UserEntity {},
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        { provide: RESOURCE_ACCESS_OPTIONS, useValue: resolvedOptions },
        { provide: getRepositoryToken(UserResourceOverride), useValue: overrideRepo },
        {
          provide: ResourceAccessService,
          useFactory: (opts, oRepo) => new ResourceAccessService(opts, oRepo, userRepo as never),
          inject: [RESOURCE_ACCESS_OPTIONS, getRepositoryToken(UserResourceOverride)],
        },
      ],
    }).compile();

    service = module.get(ResourceAccessService);
    userRepo.findOne.mockResolvedValue(mockUser);
    overrideRepo.find.mockResolvedValue([]);
  });

  it('grants manufacturer tree nodes for manufacturer role by default', async () => {
    const result = await service.getUserResourceAccess('user-1');

    expect(result.allowed_resource_ids).toContain('manufacturer.batches');
    expect(result.allowed_resource_ids).toContain('manufacturer.shipments.list');
    expect(result.nodes.find((n) => n.id === 'manufacturer.batches')?.effective).toBe(true);
  });

  it('applies deny override on a tile', async () => {
    overrideRepo.find.mockResolvedValue([
      {
        user_id: 'user-1',
        resource_id: 'manufacturer.batches',
        effect: ResourceOverrideEffect.DENY,
      },
    ]);

    const result = await service.getUserResourceAccess('user-1');
    expect(result.nodes.find((n) => n.id === 'manufacturer.batches')?.effective).toBe(false);
    expect(result.allowed_resource_ids).not.toContain('manufacturer.batches');
  });

  it('inherits deny from parent page to child tiles', async () => {
    overrideRepo.find.mockResolvedValue([
      {
        user_id: 'user-1',
        resource_id: 'manufacturer.production',
        effect: ResourceOverrideEffect.DENY,
      },
    ]);

    const result = await service.getUserResourceAccess('user-1');
    expect(result.nodes.find((n) => n.id === 'manufacturer.batches')?.effective).toBe(false);
    expect(result.nodes.find((n) => n.id === 'manufacturer.cases')?.effective).toBe(false);
    expect(result.nodes.find((n) => n.id === 'manufacturer.shipments.list')?.effective).toBe(true);
  });

  it('super_admin has all resources effective', async () => {
    userRepo.findOne.mockResolvedValue({ ...mockUser, role: 'super_admin' });
    const result = await service.getUserResourceAccess('user-1');
    expect(result.nodes.every((n) => n.effective)).toBe(true);
  });

  it('rejects toggle overrides for super_admin', async () => {
    userRepo.findOne.mockResolvedValue({ ...mockUser, role: 'super_admin' });
    await expect(
      service.toggleResourceAccess('user-1', 'manufacturer.batches', false),
    ).rejects.toThrow('Resource access overrides do not apply to super_admin users');
  });

  it('canAccessResourceForUser respects deny on block', async () => {
    overrideRepo.find.mockResolvedValue([
      {
        user_id: 'user-1',
        resource_id: 'manufacturer.batches.actions.create',
        effect: ResourceOverrideEffect.DENY,
      },
    ]);

    const allowed = await service.canAccessResourceForUser(
      'user-1',
      'manufacturer.batches.actions.create',
    );
    expect(allowed).toBe(false);
  });
});
