-- Optional v0.3 schema for multi-role + tenant-scoped overrides.
-- Adapt table/column names to your product — this is a generic example only.

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NULL,
  role VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, tenant_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_tenant
  ON user_roles(user_id, tenant_id);

-- Extend overrides with optional tenant scope (NULL = global / single-tenant apps)
ALTER TABLE user_resource_overrides
  ADD COLUMN IF NOT EXISTS tenant_id UUID NULL;

ALTER TABLE user_resource_overrides
  DROP CONSTRAINT IF EXISTS user_resource_overrides_user_id_resource_id_key;

ALTER TABLE user_resource_overrides
  ADD CONSTRAINT user_resource_overrides_user_tenant_resource_key
  UNIQUE (user_id, tenant_id, resource_id);

CREATE INDEX IF NOT EXISTS idx_user_resource_overrides_user_tenant
  ON user_resource_overrides(user_id, tenant_id);

COMMENT ON COLUMN user_resource_overrides.tenant_id IS
  'Optional org/clinic/account scope; NULL keeps v0.2 single-tenant behaviour';
