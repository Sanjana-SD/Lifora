import type { SQLiteDatabase } from 'expo-sqlite';

import { createTestDatabase } from '../helpers/testDatabase';

let mockDb: SQLiteDatabase;
jest.mock('@/database/database', () => ({
  getDatabase: () => Promise.resolve(mockDb),
}));

import * as historyService from '@/services/calculationHistoryService';

beforeEach(async () => {
  mockDb = await createTestDatabase();
});

describe('calculation history (integration)', () => {
  it('migrates to schema version 3', async () => {
    const version = await mockDb.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(version?.user_version).toBe(3);
  });

  it('records entries with their inputs, newest first', async () => {
    await historyService.recordCalculation('basic', { expression: '2+2' }, '2+2 = 4', '4');
    await historyService.recordCalculation(
      'emi',
      { principalPaise: 50_000_000, rateBp: 900, months: 60 },
      'EMI ₹10,379.18',
      '10379.18',
    );
    const entries = await historyService.listHistory();
    expect(entries.map((e) => e.calculatorType)).toEqual(['emi', 'basic']);
    expect(entries[0].inputs).toEqual({ principalPaise: 50_000_000, rateBp: 900, months: 60 });
    expect(entries[0].resultValue).toBe('10379.18');
  });

  it('rejects unknown calculator types at the database level', async () => {
    await expect(
      mockDb.runAsync(
        "INSERT INTO calculation_history (calculator_type, input_json, result_summary, result_value) VALUES ('sci', '{}', 'x', 'x')",
      ),
    ).rejects.toThrow();
  });

  it(`keeps at most ${historyService.HISTORY_LIMIT} entries, dropping the oldest`, async () => {
    for (let i = 0; i < historyService.HISTORY_LIMIT + 5; i++) {
      await historyService.recordCalculation('basic', { i }, `#${i}`, String(i));
    }
    const entries = await historyService.listHistory();
    expect(entries).toHaveLength(historyService.HISTORY_LIMIT);
    expect(entries[entries.length - 1].resultValue).toBe('5');
  });

  it('deletes single entries and clears everything', async () => {
    await historyService.recordCalculation('basic', {}, 'a', '1');
    await historyService.recordCalculation('basic', {}, 'b', '2');
    const [first] = await historyService.listHistory();
    await historyService.deleteEntry(first.id);
    expect(await historyService.listHistory()).toHaveLength(1);
    await historyService.clearHistory();
    expect(await historyService.listHistory()).toHaveLength(0);
  });
});
