# @bynalab/ui-resource-access

Control **what users see and can open** in your app — sidebar links, routes, buttons, and API endpoints — from one shared resource catalogue.

- Hierarchical UI resource tree (domain → page → tile → block)
- Role defaults + per-user allow/deny overrides
- Backend route guards and admin CRUD API
- React provider, hooks, and `<CanAccess>` components

No CASL or Casbin required. You bring auth (JWT, session, etc.) and define the catalogue in your app.

```bash
npm install @bynalab/ui-resource-access@^0.3.0
```

---

## How it works

```
Catalogue (you define)     Role defaults        User overrides (DB)
        │                        │                        │
        └──────────► effective access ◄───────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         Sidebar filter   Route guards    API @RequireResource
         <CanAccess>       redirect        403 if denied
```

**Resource types**

| Type | Example ID | Use for |
|------|------------|---------|
| `domain` | `admin` | Top-level app area |
| `page` | `admin.users` | Nav grouping |
| `tile` | `admin.users.list` | Sidebar link / route (`path` required) |
| `block` | `admin.users.list.export` | Buttons, cards, table actions |

Use the **same resource IDs** in your backend guards and frontend `<CanAccess>`.

---

## 1. Database

Run the migration from the package (adjust the `users` FK if your schema differs):

- **Single-role / single-tenant:** `migration/user_resource_overrides.sql`
- **Multi-role + tenant-scoped overrides (v0.3+):** `migration/user_resource_overrides_multi_tenant.sql`

Register the TypeORM entity (NestJS only):

```typescript
import { UserResourceOverride } from '@bynalab/ui-resource-access';
// Add UserResourceOverride to your TypeORM entities / forFeature imports
```

---

## 2. Define your catalogue

Keep this in **your app**, not inside the package. Mirror it on backend and frontend.

```typescript
// config/resource-catalogue.ts
import type { ResourceCatalogueConfig } from '@bynalab/ui-resource-access/core';

export const APP_CATALOGUE: ResourceCatalogueConfig = {
  tree: [
    {
      id: 'admin',
      type: 'domain',
      label: 'Admin',
      children: [
        {
          id: 'admin.users',
          type: 'page',
          label: 'Users',
          children: [
            {
              id: 'admin.users.list',
              type: 'tile',
              label: 'User list',
              path: '/admin/users',
              children: [
                { id: 'admin.users.list.export', type: 'block', label: 'Export' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'reports',
      type: 'domain',
      label: 'Reports',
      children: [
        {
          id: 'reports.main',
          type: 'tile',
          label: 'Reports',
          path: '/reports',
        },
      ],
    },
  ],
  role_domain_grants: {
    super_admin: ['*'],
    admin: ['admin'],
    viewer: ['reports'],
  },
  sidebar_resource_by_path: {
    '/admin/users': 'admin.users.list',
    '/reports': 'reports.main',
  },
};
```

---

## 3. Backend

Pick **NestJS** or **Fastify**. Both expose the same HTTP API and work with the React client.

### NestJS + TypeORM

```typescript
import { Module } from '@nestjs/common';
import { UiResourceAccessModule } from '@bynalab/ui-resource-access';
import { User } from './user.entity';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { APP_CATALOGUE } from './config/resource-catalogue';

@Module({
  imports: [
    UiResourceAccessModule.forRoot({
      catalogue: APP_CATALOGUE,
      userEntity: User,              // id, email, role, is_deleted?
      godModeRoles: ['super_admin'],
      adminRoles: ['super_admin'],
      authGuards: [JwtAuthGuard],
      adminGuards: [JwtAuthGuard],
    }),
  ],
})
export class AppModule {}
```

Protect a controller action:

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { ResourceAccessGuard, RequireResource } from '@bynalab/ui-resource-access';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller('admin/users')
export class UsersController {
  @Post('export')
  @UseGuards(JwtAuthGuard, ResourceAccessGuard)
  @RequireResource('admin.users.list.export')
  exportUsers() {
    // ...
  }
}
```

**Peers:** `@nestjs/common`, `@nestjs/core`, `@nestjs/typeorm`, `@nestjs/swagger`, `typeorm`, `class-validator`, `class-transformer`

### Fastify + pg

```typescript
import Fastify from 'fastify';
import { createUiResourceAccess } from '@bynalab/ui-resource-access/fastify';
import { pool } from './db';
import { authenticate } from './middleware/authenticate';
import { APP_CATALOGUE } from './config/resource-catalogue';

const fastify = Fastify();

const resourceAccess = createUiResourceAccess({
  pool,
  catalogue: APP_CATALOGUE,
  godModeRoles: ['super_admin'],
  adminRoles: ['super_admin'],
  preHandlers: [authenticate],
  getContext: (req) => ({
    userId: req.user.id,
    tenantId: req.organizationId, // optional
    roles: req.userRoles,         // optional — storage can load roles
  }),
});

resourceAccess.registerRoutes(fastify);

fastify.post('/admin/users/export', {
  preHandler: [
    authenticate,
    resourceAccess.requireResource('admin.users.list.export'),
  ],
}, async () => {
  // ...
});

await fastify.listen({ port: 3000 });
```

**Peers:** `fastify`, `pg`

Optional: `adminControllerPath: 'admin/rbac'` if you want a custom admin URL prefix.

---

## 4. React / Next.js

Configure once, then wrap your layout.

```typescript
// lib/rbac/setup.ts
import { configureResourceAccess } from '@bynalab/ui-resource-access/react';
import { APP_CATALOGUE } from '../config/resource-catalogue';

configureResourceAccess({
  getApiBaseUrl: () => process.env.NEXT_PUBLIC_API_URL!,
  credentials: 'include', // cookie/session apps — omit getAuthHeaders
  sidebarResourceByPath: APP_CATALOGUE.sidebar_resource_by_path ?? {},
});

// Bearer token apps:
// getAuthHeaders: () => ({ Authorization: `Bearer ${getToken()}` }),
```

```tsx
// app/(portal)/layout.tsx
'use client';

import {
  ResourceAccessProvider,
  CanAccess,
  useResourceAccess,
  useMemoizedSidebarFilter,
} from '@bynalab/ui-resource-access/react';
import { ensureResourceAccessConfigured } from '@/lib/rbac/setup';

ensureResourceAccessConfigured();

export default function PortalLayout({ children }) {
  const { canAccessPath } = useResourceAccess();
  const items = useMemoizedSidebarFilter(rawSidebarItems, canAccessPath);

  return (
    <ResourceAccessProvider>
      <Sidebar items={items} />
      {children}
    </ResourceAccessProvider>
  );
}
```

Hide a button:

```tsx
<CanAccess resourceId="admin.users.list.export">
  <ExportButton />
</CanAccess>
```

**Peer:** `react` ≥ 18

---

## HTTP API

Default admin prefix: `admin/resource-access`. Override with `adminControllerPath`.

| Method | Path | Who | Purpose |
|--------|------|-----|---------|
| GET | `/resource-access/me` | User | Allowed resource IDs (+ optional `roles`, `isSuperAdmin`) |
| GET | `/admin/resource-access/resource-catalogue` | Admin | Full tree for editor |
| GET | `/admin/resource-access/users/:id/resource-access` | Admin | User override state |
| PUT | `/admin/resource-access/users/:id/resource-access/batch` | Admin | Batch save overrides |
| PATCH | `/admin/resource-access/users/:id/resource-access/toggle` | Admin | Toggle one node |

If you set `adminControllerPath: 'admin/rbac'`, paths become `/admin/rbac/...`.

---

## Package exports

| Import | When to use |
|--------|-------------|
| `@bynalab/ui-resource-access` | NestJS (main entry) |
| `@bynalab/ui-resource-access/nestjs` | Same as main |
| `@bynalab/ui-resource-access/fastify` | Fastify + pg |
| `@bynalab/ui-resource-access/react` | Frontend provider, hooks, guards |
| `@bynalab/ui-resource-access/core` | Types and catalogue helpers only |
| `@bynalab/ui-resource-access/server` | Custom storage adapter / advanced use |

Use **`^0.3.0`** for multi-role/tenant storage, `getContext`, and cookie-session React auth.

---

## Multi-role & multi-tenant integration (v0.3+)

v0.2 apps keep working unchanged (single `users.role`, overrides keyed by `user_id` only). Opt in when you need multiple roles per user or tenant-scoped overrides.

### Storage contract

Implement or use a reference adapter from `@bynalab/ui-resource-access/server`:

```typescript
interface ResourceAccessContext {
  userId: string;
  tenantId?: string;
  roles?: string[]; // optional hint; storage loads roles when omitted
}

interface ResourceAccessStorage {
  findUser(ctx: ResourceAccessContext): Promise<ResourceAccessUser | null>;
  getUserRoles(ctx: ResourceAccessContext): Promise<string[]>;
  loadOverrideMap(ctx: ResourceAccessContext): Promise<Map<string, ResourceOverrideEffect>>;
  upsertOverride(ctx, resourceId, effect): Promise<void>;
  deleteOverride(ctx, resourceId): Promise<void>;
}
```

**Reference adapters (Fastify):**

| Adapter | Use |
|---------|-----|
| `createPgResourceAccessStorage(pool)` | v0.2 behaviour — single role from `users.role` |
| `createPgMultiRoleStorage(pool)` | Roles from `user_roles` join table + `tenant_id` on overrides |

Pass custom storage to the factory:

```typescript
import {
  createUiResourceAccess,
  createPgMultiRoleStorage,
} from '@bynalab/ui-resource-access/fastify';

const resourceAccess = createUiResourceAccess({
  catalogue: APP_CATALOGUE,
  storage: createPgMultiRoleStorage(pool),
  preHandlers: [authenticate, scopeToTenant],
  getContext: (req) => ({ userId: req.user.id, tenantId: req.tenantId }),
});
```

NestJS: implement `ResourceAccessStorage` or use TypeORM adapter (single-role). Set `getContextFromRequest` on the module for tenant scope.

### Resolution rules

| Case | Result |
|------|--------|
| Any role grants the domain (union) | Allowed by role default |
| Any role in `godModeRoles` | Allowed |
| Ancestor **deny** override | Descendants denied |
| Ancestor **allow** override | Descendants allowed unless explicit child deny |
| `/me` vs `requireResource()` | Same resolver path — IDs always agree |

Multi-role helpers exported from `/core`:

- `buildNodeStateMultiRole`
- `computeAllowedResourceIdsMultiRole`
- `canAccessResourceMultiRole`

Single-role helpers (`buildNodeState`, `canAccessResource`, …) remain and delegate internally.

### Toggle inheritance

When an admin **enables** a parent node, descendant overrides are cleared so inheritance applies cleanly. **Disabling** a parent sets a deny override on that node; descendants inherit the deny.

### Migrating from a local fork

If you copied resolver or `/me` logic locally:

1. Remove forked resolution — use `@bynalab/ui-resource-access/core` multi-role helpers or the built-in service.
2. Replace direct SQL on `user_resource_overrides` with a `ResourceAccessStorage` adapter (or the PG reference adapters).
3. Wire `getContext` / `getContextFromRequest` in your auth middleware layer (tenant id stays host-owned).
4. Point React at `/resource-access/me` with `credentials: 'include'` when using sessions.

---

## What this does not replace

This package gates **UI resources** (navigation and catalogue-aligned endpoints). Use CASL, Casbin, or row-level checks separately for entity-level authorization (e.g. “can edit this specific record”). The two layers complement each other.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| UI shows items user shouldn't see | Check `sidebar_resource_by_path` and that `ResourceAccessProvider` wraps the layout |
| API returns 403 but UI allows access | Add `@RequireResource` / `requireResource()` on the backend route |
| Admin editor empty or 404 | Match `adminControllerPath` with React `adminEndpoints` config |
| `Can't resolve '../core/...'` in React | Upgrade to `^0.1.1` or later (compiled `dist/react`) |
