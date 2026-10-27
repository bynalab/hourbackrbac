import type { Pool } from 'pg';
import type { ResourceAccessContext } from '../core/types';
import type { ResourceAccessStorage } from '../server/storage';
import type { ResourceAccessUser, ResourceOverrideEffect } from '../server/types';
import type { PgUserTableConfig } from './pg-storage';

export interface PgMultiRoleStorageConfig {
  userTable?: PgUserTableConfig;
  /** Join table: user_id + role (+ optional tenant_id column) */
  userRolesTable?: string;
  userRolesUserIdColumn?: string;
  userRolesRoleColumn?: string;
  userRolesTenantIdColumn?: string;
  /** Overrides table — defaults to user_resource_overrides with tenant_id column */
  overridesTable?: string;
  overridesTenantIdColumn?: string;
}

const DEFAULTS: Required<Omit<PgMultiRoleStorageConfig, 'userTable'>> & {
  userTable: Required<PgUserTableConfig>;
} = {
  userTable: {
    table: 'users',
    idColumn: 'id',
    emailColumn: 'email',
    roleColumn: 'role',
    isDeletedColumn: 'is_deleted',
  },
  userRolesTable: 'user_roles',
  userRolesUserIdColumn: 'user_id',
  userRolesRoleColumn: 'role',
  userRolesTenantIdColumn: 'tenant_id',
  overridesTable: 'user_resource_overrides',
  overridesTenantIdColumn: 'tenant_id',
};

/**
 * Multi-role + optional tenant-scoped overrides.
 * Expects migration/user_resource_overrides_multi_tenant.sql (generic example schema).
 */
export function createPgMultiRoleStorage(
  pool: Pool,
  config: PgMultiRoleStorageConfig = {},
): ResourceAccessStorage {
  const cfg = {
    ...DEFAULTS,
    ...config,
    userTable: { ...DEFAULTS.userTable, ...config.userTable },
  };

  return {
    async findUser(ctx: ResourceAccessContext): Promise<ResourceAccessUser | null> {
      const result = await pool.query(
        `SELECT ${cfg.userTable.idColumn} AS id, ${cfg.userTable.emailColumn} AS email, ${cfg.userTable.roleColumn} AS role, ${cfg.userTable.isDeletedColumn} AS is_deleted
         FROM ${cfg.userTable.table}
         WHERE ${cfg.userTable.idColumn} = $1`,
        [ctx.userId],
      );
      const row = result.rows[0] as ResourceAccessUser | undefined;
      if (!row || row.is_deleted) {
        return null;
      }
      return row;
    },

    async getUserRoles(ctx: ResourceAccessContext): Promise<string[]> {
      if (ctx.roles?.length) {
        return ctx.roles;
      }

      if (ctx.tenantId) {
        const result = await pool.query<{ role: string }>(
          `SELECT ${cfg.userRolesRoleColumn} AS role
           FROM ${cfg.userRolesTable}
           WHERE ${cfg.userRolesUserIdColumn} = $1 AND ${cfg.userRolesTenantIdColumn} = $2`,
          [ctx.userId, ctx.tenantId],
        );
        if (result.rows.length > 0) {
          return result.rows.map((row) => row.role);
        }
      }

      const result = await pool.query<{ role: string }>(
        `SELECT ${cfg.userRolesRoleColumn} AS role
         FROM ${cfg.userRolesTable}
         WHERE ${cfg.userRolesUserIdColumn} = $1
           AND (${cfg.userRolesTenantIdColumn} IS NULL OR ${cfg.userRolesTenantIdColumn} = $2)`,
        [ctx.userId, ctx.tenantId ?? null],
      );
      if (result.rows.length > 0) {
        return result.rows.map((row) => row.role);
      }

      const user = await this.findUser(ctx);
      return user?.role ? [user.role] : [];
    },

    async loadOverrideMap(ctx: ResourceAccessContext) {
      const result = await pool.query<{ resource_id: string; effect: ResourceOverrideEffect }>(
        `SELECT resource_id, effect
         FROM ${cfg.overridesTable}
         WHERE user_id = $1
           AND (
             (${cfg.overridesTenantIdColumn} IS NULL AND $2::text IS NULL)
             OR ${cfg.overridesTenantIdColumn} = $2
           )`,
        [ctx.userId, ctx.tenantId ?? null],
      );
      return new Map(result.rows.map((row) => [row.resource_id, row.effect]));
    },

    async deleteOverride(ctx: ResourceAccessContext, resourceId: string) {
      await pool.query(
        `DELETE FROM ${cfg.overridesTable}
         WHERE user_id = $1 AND resource_id = $2
           AND (
             (${cfg.overridesTenantIdColumn} IS NULL AND $3::text IS NULL)
             OR ${cfg.overridesTenantIdColumn} = $3
           )`,
        [ctx.userId, resourceId, ctx.tenantId ?? null],
      );
    },

    async upsertOverride(ctx: ResourceAccessContext, resourceId: string, effect: ResourceOverrideEffect) {
      await pool.query(
        `INSERT INTO ${cfg.overridesTable} (user_id, ${cfg.overridesTenantIdColumn}, resource_id, effect)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, ${cfg.overridesTenantIdColumn}, resource_id)
         DO UPDATE SET effect = EXCLUDED.effect, updated_at = NOW()`,
        [ctx.userId, ctx.tenantId ?? null, resourceId, effect],
      );
    },
  };
}
