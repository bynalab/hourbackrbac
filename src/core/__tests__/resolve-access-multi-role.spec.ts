import type { ResourceCatalogueConfig } from '../types';
import {
  buildNodeStateMultiRole,
  canAccessResourceMultiRole,
  computeAllowedResourceIdsMultiRole,
} from '../resolve-access';

const CATALOGUE: ResourceCatalogueConfig = {
  tree: [
    {
      id: 'app',
      type: 'domain',
      label: 'App',
      children: [
        {
          id: 'app.reports',
          type: 'tile',
          label: 'Reports',
          path: '/reports',
          children: [{ id: 'app.reports.export', type: 'block', label: 'Export' }],
        },
        {
          id: 'app.admin',
          type: 'tile',
          label: 'Admin',
          path: '/admin',
        },
      ],
    },
  ],
  role_domain_grants: {
    viewer: ['app'],
    editor: ['app'],
    admin: ['app'],
  },
};

describe('multi-role resolve-access', () => {
  it('grants union of roles (viewer + editor)', () => {
    const allowed = computeAllowedResourceIdsMultiRole(['viewer', 'editor'], new Map(), CATALOGUE, []);
    expect(allowed).toContain('app.reports');
    expect(allowed).toContain('app.admin');
  });

  it('godModeRoles on any assigned role grants everything', () => {
    const allowed = computeAllowedResourceIdsMultiRole(
      ['viewer', 'super_admin'],
      new Map(),
      CATALOGUE,
      ['super_admin'],
    );
    expect(allowed).toEqual(['app', 'app.reports', 'app.reports.export', 'app.admin']);
  });

  it('ancestor deny blocks descendants', () => {
    const overrides = new Map<string, 'allow' | 'deny'>([['app.reports', 'deny']]);
    expect(canAccessResourceMultiRole(['viewer'], 'app.reports.export', overrides, CATALOGUE, [])).toBe(
      false,
    );
  });

  it('child deny under allowed parent blocks only the child', () => {
    const overrides = new Map<string, 'allow' | 'deny'>([['app.reports.export', 'deny']]);
    expect(canAccessResourceMultiRole(['viewer'], 'app.reports', overrides, CATALOGUE, [])).toBe(true);
    expect(canAccessResourceMultiRole(['viewer'], 'app.reports.export', overrides, CATALOGUE, [])).toBe(
      false,
    );
  });

  it('ancestor allow enables descendants unless child deny exists', () => {
    const overrides = new Map<string, 'allow' | 'deny'>([['app.reports', 'allow']]);
    const flat = CATALOGUE.tree[0].children![0];
    const node = { ...flat, parent_id: 'app', depth: 1 } as const;
    const state = buildNodeStateMultiRole(['viewer'], node as never, overrides, CATALOGUE, []);
    expect(state.effective).toBe(true);
  });
});
