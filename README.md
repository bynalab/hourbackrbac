# @apeiro/ui-resource-access

Portable **RBAC v2** — hierarchical UI resource catalogue (domain → page → tile → block), per-user overrides, sidebar/route guards, and API `@RequireResource` enforcement.

**No CASL / Casbin dependency.** Host projects supply auth guards and the resource tree.

## Quick start (new project)

### 1. Copy folder

Copy `packages/ui-resource-access/` into your repo (or publish to a private npm registry).

### 2. Database

Run `migration/user_resource_overrides.sql` as a Flyway/Liquibase migration (adjust `users` FK if your user table differs).

### 3. Host catalogue

Create a catalogue file in **your** app (not inside the package):

```typescript
export const MY_CATALOGUE = {
  tree: [/* ResourceNode[] */],
  role_domain_grants: { admin: ['*'], viewer: ['reports'] },
  sidebar_resource_by_path: { '/reports': 'reports.main' },
};
```

### 4. NestJS backend

```typescript
import { UiResourceAccessModule } from '@apeiro/ui-resource-access';
import { User } from './user.entity';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { MY_CATALOGUE } from './my-catalogue';

@Module({
  imports: [
    UiResourceAccessModule.forRoot({
      catalogue: MY_CATALOGUE,
      userEntity: User,
      godModeRoles: ['super_admin'],
      adminRoles: ['super_admin'],
      authGuards: [JwtAuthGuard],
      adminGuards: [JwtAuthGuard],
    }),
  ],
})
export class AppModule {}
```

Protect routes:

```typescript
@UseGuards(JwtAuthGuard, ResourceAccessGuard)
@RequireResource('reports.actions.export')
@Post('export')
export() { ... }
```

### 5. React / Next.js frontend

```typescript
import { configureResourceAccess } from '@apeiro/ui-resource-access/react';

configureResourceAccess({
  getApiBaseUrl: () => process.env.NEXT_PUBLIC_API_URL!,
  getAuthHeaders: () => ({ Authorization: `Bearer ${getToken()}` }),
  sidebarResourceByPath: MY_CATALOGUE.sidebar_resource_by_path ?? {},
});
```

Wrap layout with `ResourceAccessProvider`, use `CanAccess`, `ResourceAccessGuard`, and `useResourceAccess`.

## API routes (default)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/resource-access/me` | Current user's allowed resource IDs |
| GET | `/admin/resource-access/resource-catalogue` | Full tree (admin) |
| GET | `/admin/resource-access/users/:id/resource-access` | User editor state |
| PUT | `/admin/resource-access/users/:id/resource-access/batch` | Batch overrides |
| PATCH | `/admin/resource-access/users/:id/resource-access/toggle` | Toggle one node |

Set `adminControllerPath: 'admin/rbac'` to match legacy Kenya TNT paths.

## Kenya TNT integration

- Catalogue: `resource-catalogue/kenya-tnt.ts`
- Backend config: `core-monolith/src/config/ui-resource-access.config.ts`
- Frontend setup: `frontend/lib/rbac/setup.ts`

## vs CASL

Use **this package** for UI visibility and catalogue-aligned API gates. Use CASL (or another policy engine) separately for entity-level authorization if needed — they are complementary, not replacements.
