import type { SQLiteDatabase } from 'expo-sqlite';

import { createTestDatabase } from '../helpers/testDatabase';

let mockDb: SQLiteDatabase;
jest.mock('@/database/database', () => ({
  getDatabase: () => Promise.resolve(mockDb),
}));

import * as settingsService from '@/services/settingsService';

beforeEach(async () => {
  mockDb = await createTestDatabase();
});

describe('appearance setting (integration)', () => {
  it('follows the system by default (seeded by migration 001)', async () => {
    expect(await settingsService.getThemePreference()).toBe('system');
  });

  it('saves and reloads each choice', async () => {
    for (const choice of ['dark', 'light', 'system'] as const) {
      await settingsService.setThemePreference(choice);
      expect(await settingsService.getThemePreference()).toBe(choice);
    }
  });

  it('falls back to the system for an unrecognised stored value', async () => {
    await mockDb.runAsync("UPDATE app_settings SET value = 'sepia' WHERE key = 'theme'");
    expect(await settingsService.getThemePreference()).toBe('system');
  });

  it('recreates the row if it is missing', async () => {
    await mockDb.runAsync("DELETE FROM app_settings WHERE key = 'theme'");
    expect(await settingsService.getThemePreference()).toBe('system');
    await settingsService.setThemePreference('dark');
    expect(await settingsService.getThemePreference()).toBe('dark');
  });
});
