function overrideKey(ctx, resourceId) {
  return `${ctx.tenantId ?? ''}::${ctx.userId}::${resourceId}`;
}

function rolesKey(ctx) {
  return `${ctx.tenantId ?? ''}::${ctx.userId}`;
}

/**
 * In-memory ResourceAccessStorage for the demo.
 * Supports multi-role + optional tenant-scoped overrides.
 */
function createMemoryStorage({ users, rolesByUserTenant }) {
  const overrides = new Map();

  return {
    async findUser(ctx) {
      const user = users[ctx.userId];
      if (!user || user.is_deleted) return null;
      return user;
    },

    async getUserRoles(ctx) {
      if (ctx.roles?.length) return ctx.roles;
      const mapped = rolesByUserTenant[rolesKey(ctx)] ?? rolesByUserTenant[ctx.userId];
      if (mapped?.length) return mapped;
      const user = users[ctx.userId];
      return user?.role ? [user.role] : [];
    },

    async loadOverrideMap(ctx) {
      const prefix = `${ctx.tenantId ?? ''}::${ctx.userId}::`;
      const map = new Map();
      for (const [key, effect] of overrides) {
        if (key.startsWith(prefix)) {
          map.set(key.slice(prefix.length), effect);
        }
      }
      return map;
    },

    async upsertOverride(ctx, resourceId, effect) {
      overrides.set(overrideKey(ctx, resourceId), effect);
    },

    async deleteOverride(ctx, resourceId) {
      overrides.delete(overrideKey(ctx, resourceId));
    },
  };
}

module.exports = { createMemoryStorage };
