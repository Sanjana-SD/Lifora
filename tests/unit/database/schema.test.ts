import { CREATE_APP_SETTINGS_TABLE, CREATE_CATEGORIES_TABLE, CURRENT_SCHEMA_VERSION } from '@/database/schema';
import { DEFAULT_CATEGORIES } from '@/database/seed/defaultCategories';
import { MIGRATIONS } from '@/database/migrations';

describe('database schema', () => {
  it('defines the categories and app_settings tables', () => {
    expect(CREATE_CATEGORIES_TABLE).toContain('CREATE TABLE IF NOT EXISTS categories');
    expect(CREATE_APP_SETTINGS_TABLE).toContain('CREATE TABLE IF NOT EXISTS app_settings');
  });

  it('exposes a positive current schema version', () => {
    expect(CURRENT_SCHEMA_VERSION).toBeGreaterThan(0);
  });
});

describe('default category seed data', () => {
  it('has no duplicate names within a scope', () => {
    const seenPerScope: Record<string, Set<string>> = { calendar: new Set(), finance: new Set() };
    for (const category of DEFAULT_CATEGORIES) {
      expect(seenPerScope[category.scope].has(category.name)).toBe(false);
      seenPerScope[category.scope].add(category.name);
    }
  });

  it('includes every calendar category from the PRD', () => {
    const calendarNames = DEFAULT_CATEGORIES.filter((c) => c.scope === 'calendar').map((c) => c.name);
    expect(calendarNames).toEqual(['Personal', 'College', 'Work', 'Meetings', 'Birthdays', 'Other']);
  });
});

describe('migration runner ordering', () => {
  it('lists migrations in strictly ascending version order', () => {
    const versions = MIGRATIONS.map((m) => m.version);
    const sorted = [...versions].sort((a, b) => a - b);
    expect(versions).toEqual(sorted);
    expect(new Set(versions).size).toBe(versions.length);
  });
});
