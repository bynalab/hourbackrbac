/** Host-owned catalogue — domain → page/tile → block. */
const APP_CATALOGUE = {
  tree: [
    {
      id: 'reports',
      type: 'domain',
      label: 'Reports',
      children: [
        {
          id: 'reports.main',
          type: 'tile',
          label: 'View reports',
          path: '/reports',
          children: [
            { id: 'reports.export', type: 'block', label: 'Export' },
          ],
        },
      ],
    },
    {
      id: 'items',
      type: 'domain',
      label: 'Items',
      children: [
        {
          id: 'items.list',
          type: 'tile',
          label: 'Item list',
          path: '/items',
          children: [
            { id: 'items.create', type: 'block', label: 'Create' },
            { id: 'items.delete', type: 'block', label: 'Delete' },
          ],
        },
      ],
    },
    {
      id: 'admin',
      type: 'domain',
      label: 'Admin',
      children: [
        {
          id: 'admin.users',
          type: 'tile',
          label: 'Manage users',
          path: '/admin/users',
        },
      ],
    },
  ],
  role_domain_grants: {
    super_admin: ['*'],
    admin: ['admin'],
    editor: ['items', 'reports'],
    viewer: ['reports'],
  },
  sidebar_resource_by_path: {
    '/reports': 'reports.main',
    '/items': 'items.list',
    '/admin/users': 'admin.users',
  },
};

module.exports = { APP_CATALOGUE };
