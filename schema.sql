-- Database D1 del sito B&B Galileo Galilei
-- npx wrangler d1 execute galileo-galilei-bnb --remote --file=schema.sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'nuova',
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_requests_created ON requests (created_at DESC);
