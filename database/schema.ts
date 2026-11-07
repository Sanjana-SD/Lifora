// Canonical schema DDL. New tables are added here, one statement per
// migration, as each module's phase introduces them (see
// docs/Lifora_Complete_PRD.md, Section 8 and Section 14). Phase 1 only
// needs the reference data shared by every future module: categories and
// app-wide settings.

export const CURRENT_SCHEMA_VERSION = 1;

export const CREATE_CATEGORIES_TABLE = `
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT NOT NULL CHECK (scope IN ('calendar', 'finance')),
  name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  icon_key TEXT,
  is_system INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (scope, name)
);
`;

export const CREATE_APP_SETTINGS_TABLE = `
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
