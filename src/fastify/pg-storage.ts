import type { Pool } from 'pg';
import type { ResourceAccessContext } from '../core/types';
import type { ResourceAccessStorage } from '../server/storage';
import type { ResourceAccessUser, ResourceOverrideEffect } from '../server/types';

export interface PgUserTableConfig {
  table?: string;
  idColumn?: string;
  emailColumn?: string;
  roleColumn?: string;
  isDeletedColumn?: string;
}

const DEFAULT_USER_TABLE: Required<PgUserTableConfig> = {
  table: 'users',
  idColumn: 'id',
  emailColumn: 'email',
  roleColumn: 'role',
  isDeletedColumn: 'is_deleted',
};

/** v0.2-compatible single-role storage (user_id overrides, roles from users.role). */
export function createPgResourceAccessStorage(
  pool: Pool,
  userTable: PgUserTableConfig = {},
): ResourceAccessStorage {
  const users = { ...DEFAULT_USER_TABLE, ...userTable };

  return {
    async findUser(ctx: ResourceAccessContext): Promise<ResourceAccessUser | null> {
      const result = await pool.query(
        `SELECT ${users.idColumn} AS id, ${users.emailColumn} AS email, ${users.roleColumn} AS role, ${users.isDeletedColumn} AS is_deleted
         FROM ${users.table}
         WHERE ${users.idColumn} = $1`,
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
      const user = await this.findUser(ctx);
      return user?.role ? [user.role] : [];
    },

    async loadOverrideMap(ctx: ResourceAccessContext) {
      const result = await pool.query<{ resource_id: string; effect: ResourceOverrideEffect }>(
        `SELECT resource_id, effect FROM user_resource_overrides WHERE user_id = $1`,
        [ctx.userId],
      );
      return new Map(result.rows.map((row) => [row.resource_id, row.effect]));
    },

    async deleteOverride(ctx: ResourceAccessContext, resourceId: string) {
      await pool.query(
        `DELETE FROM user_resource_overrides WHERE user_id = $1 AND resource_id = $2`,
        [ctx.userId, resourceId],
      );
    },

    async upsertOverride(ctx: ResourceAccessContext, resourceId: string, effect: ResourceOverrideEffect) {
      await pool.query(
        `INSERT INTO user_resource_overrides (user_id, resource_id, effect)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, resource_id)
         DO UPDATE SET effect = EXCLUDED.effect, updated_at = NOW()`,
        [ctx.userId, resourceId, effect],
      );
    },
  };
}
