import { NotFoundException } from '@nestjs/common';
import { ResourceAccessService as NestResourceAccessService } from '../resource-access.service';
import { ResourceAccessService as CoreResourceAccessService, resolveServiceOptions } from '../../server';
import type { ResourceAccessStorage } from '../../server/storage';

describe('ResourceAccessService (Nest wrapper)', () => {
  it('maps not-found errors to NotFoundException', async () => {
    const storage: ResourceAccessStorage = {
      findUser: jest.fn(async () => null),
      getUserRoles: jest.fn(async () => []),
      loadOverrideMap: jest.fn(async () => new Map()),
      deleteOverride: jest.fn(),
      upsertOverride: jest.fn(),
    };

    const core = new CoreResourceAccessService(
      resolveServiceOptions({
        catalogue: { tree: [], role_domain_grants: {} },
      }),
      storage,
    );
    const service = new NestResourceAccessService(core, {
      catalogue: { tree: [], role_domain_grants: {} },
      userEntity: class UserEntity {},
      godModeRoles: ['super_admin'],
      adminRoles: ['super_admin'],
      adminControllerPath: 'admin/resource-access',
      registerControllers: true,
    });

    await expect(service.getUserResourceAccess('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
