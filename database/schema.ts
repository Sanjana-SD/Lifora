// Canonical schema DDL. New tables are added here, one statement per
// migration, as each module's phase introduces them (see
// Lifora_Complete_PRD.md, Section 8 and Section 14).

export const CURRENT_SCHEMA_VERSION = 5;

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

// Calendar, reminders, and tasks (PRD Section 8.2). Instants are stored
// as UTC ISO strings; recurrence_until is a local calendar date
// ("YYYY-MM-DD"). A single edited or deleted occurrence of a recurring
// event is an exception row: parent_event_id + original_start_at identify
// the occurrence it replaces, and is_cancelled marks a deleted one.
export const CREATE_EVENTS_TABLE = `
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  recurrence_freq TEXT NOT NULL DEFAULT 'none' CHECK (recurrence_freq IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  recurrence_interval INTEGER NOT NULL DEFAULT 1 CHECK (recurrence_interval >= 1),
  recurrence_until TEXT,
  recurrence_count INTEGER CHECK (recurrence_count IS NULL OR recurrence_count >= 1),
  notification_offset_minutes INTEGER CHECK (notification_offset_minutes IS NULL OR notification_offset_minutes >= 0),
  parent_event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  original_start_at TEXT,
  is_exception INTEGER NOT NULL DEFAULT 0,
  is_cancelled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (end_at >= start_at)
);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_at);
CREATE INDEX IF NOT EXISTS idx_events_parent ON events(parent_event_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_exception ON events(parent_event_id, original_start_at) WHERE is_exception = 1;
`;

export const CREATE_REMINDERS_TABLE = `
CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  due_at TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  recurrence_freq TEXT NOT NULL DEFAULT 'none' CHECK (recurrence_freq IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  recurrence_interval INTEGER NOT NULL DEFAULT 1 CHECK (recurrence_interval >= 1),
  recurrence_until TEXT,
  series_start_at TEXT NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  snoozed_until TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(is_completed, due_at);
`;

// A date-only deadline is stored as the end of that local day with
// deadline_has_time = 0, so ordering and "overdue" work uniformly.
export const CREATE_TASKS_TABLE = `
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  deadline_at TEXT,
  deadline_has_time INTEGER NOT NULL DEFAULT 0,
  notify INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  is_completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_status_deadline ON tasks(is_completed, deadline_at);
`;

// Phase 6 (PRD Section 8.3). import_history is created now, ahead of CSV
// import (Phase 7), because transactions references it and SQLite can't
// add a foreign key to an existing table without rebuilding it.
export const CREATE_IMPORT_HISTORY_TABLE = `
CREATE TABLE IF NOT EXISTS import_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name TEXT NOT NULL,
  detected_format_label TEXT,
  imported_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  column_mapping_json TEXT,
  imported_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`;

// Amounts are integer paise (PRD 4.H); occurred_on is a local calendar
// date, 'YYYY-MM-DD', so day and month grouping never shifts with timezone.
export const CREATE_TRANSACTIONS_TABLE = `
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  occurred_on TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN
    ('google_pay', 'phonepe', 'paytm', 'bank_transfer', 'cash', 'card', 'other')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'import')),
  import_history_id INTEGER REFERENCES import_history(id) ON DELETE SET NULL,
  external_reference TEXT,
  is_duplicate_reviewed INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(occurred_on);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_import ON transactions(import_history_id);
`;
