-- Copy into your project's migrations folder (adjust users FK table name if needed).
-- RBAC v2 — per-user resource tree allow/deny overrides.

CREATE TABLE IF NOT EXISTS user_resource_overrides (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id VARCHAR(128) NOT NULL,
  effect VARCHAR(8) NOT NULL CHECK (effect IN ('allow', 'deny')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_user_resource_overrides_user_id
  ON user_resource_overrides(user_id);

COMMENT ON TABLE user_resource_overrides IS
  'RBAC v2 direct allow/deny overrides on catalogue resource IDs; role defaults apply when no override exists';
