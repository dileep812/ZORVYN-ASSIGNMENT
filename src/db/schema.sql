-- Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  username VARCHAR(80),
  password_hash TEXT,
  role VARCHAR(20) NOT NULL CHECK (role IN ('viewer', 'analyst', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backward-compatible changes for existing databases
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(80);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Backfill existing rows so login works after migration
UPDATE users
SET username = email
WHERE username IS NULL;

UPDATE users
SET password_hash = '$2b$10$jBB57p3UKVQAq9pNeFg6U.PccIvUjPTiOu7vkBaTiY1ElOSF.JLlC'
WHERE password_hash IS NULL;

ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;

-- Financial records with optimistic locking for concurrency safety
CREATE TABLE IF NOT EXISTS financial_records (
  id BIGSERIAL PRIMARY KEY,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(100) NOT NULL,
  record_date DATE NOT NULL,
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_records_date ON financial_records (record_date);
CREATE INDEX IF NOT EXISTS idx_financial_records_type ON financial_records (type);
CREATE INDEX IF NOT EXISTS idx_financial_records_category ON financial_records (category);
CREATE INDEX IF NOT EXISTS idx_financial_records_not_deleted ON financial_records (is_deleted);
CREATE INDEX IF NOT EXISTS idx_financial_records_created_by ON financial_records (created_by);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users (role, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_single_admin ON users (role) WHERE role = 'admin';

-- Seed users
INSERT INTO users (name, email, username, password_hash, role)
VALUES
  ('Admin One', 'admin1@finance.local', 'admin1', '$2b$10$jBB57p3UKVQAq9pNeFg6U.PccIvUjPTiOu7vkBaTiY1ElOSF.JLlC', 'admin'),
  ('Analyst One', 'analyst1@finance.local', 'analyst1', '$2b$10$jBB57p3UKVQAq9pNeFg6U.PccIvUjPTiOu7vkBaTiY1ElOSF.JLlC', 'analyst'),
  ('Analyst Two', 'analyst2@finance.local', 'analyst2', '$2b$10$jBB57p3UKVQAq9pNeFg6U.PccIvUjPTiOu7vkBaTiY1ElOSF.JLlC', 'analyst'),
  ('Viewer One', 'viewer1@finance.local', 'viewer1', '$2b$10$jBB57p3UKVQAq9pNeFg6U.PccIvUjPTiOu7vkBaTiY1ElOSF.JLlC', 'viewer')
ON CONFLICT (email)
DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  name = EXCLUDED.name;
