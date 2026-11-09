// Canonical schema DDL. New tables are added here, one statement per
// migration, as each module's phase introduces them (see
// Lifora_Complete_PRD.md, Section 8 and Section 14).

export const CURRENT_SCHEMA_VERSION = 3;

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

// Notes use a fixed text category list (constants/noteCategories.ts)
// rather than the PRD's category_id FK: the categories table's scope
// CHECK only allows 'calendar' | 'finance', and widening it means a
// table rebuild. Revisit if user-defined note categories ship (V1.1).
export const CREATE_NOTES_TABLE = `
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  color_key TEXT NOT NULL DEFAULT 'default',
  category TEXT,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  is_favourite INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_notes_pinned_updated ON notes(is_pinned DESC, updated_at DESC);
`;

export const CREATE_CHECKLISTS_TABLE = `
CREATE TABLE IF NOT EXISTS checklists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  template_key TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`;

export const CREATE_CHECKLIST_ITEMS_TABLE = `
CREATE TABLE IF NOT EXISTS checklist_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  checklist_id INTEGER NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist ON checklist_items(checklist_id, sort_order);
`;

// result_value is an addition to the PRD schema: the plain value that
// "copy" puts on the clipboard (e.g. "36"), kept separate from the
// human-readable result_summary ("12×3 = 36").
export const CREATE_CALCULATION_HISTORY_TABLE = `
CREATE TABLE IF NOT EXISTS calculation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  calculator_type TEXT NOT NULL CHECK (calculator_type IN ('basic')),
  input_json TEXT NOT NULL,
  result_summary TEXT NOT NULL,
  result_value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_calculation_history_created ON calculation_history(created_at DESC);
`;
