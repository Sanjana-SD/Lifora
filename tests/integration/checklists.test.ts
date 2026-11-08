import type { SQLiteDatabase } from 'expo-sqlite';

import { createTestDatabase } from '../helpers/testDatabase';

let mockDb: SQLiteDatabase;
jest.mock('@/database/database', () => ({
  getDatabase: () => Promise.resolve(mockDb),
}));

import { CHECKLIST_TEMPLATES } from '@/constants/checklistTemplates';
import * as checklistService from '@/services/checklistService';
import { ValidationError } from '@/utils/validationUtils';

beforeEach(async () => {
  mockDb = await createTestDatabase();
});

describe('checklistService (integration)', () => {
  it('creates every starter template with its items pre-populated', async () => {
    for (const template of CHECKLIST_TEMPLATES) {
      const id = await checklistService.createFromTemplate(template.key);
      const result = await checklistService.getChecklistWithItems(id);
      expect(result!.checklist.title).toBe(template.title);
      expect(result!.items.map((i) => i.label)).toEqual(template.items);
    }
    expect(await checklistService.listChecklists()).toHaveLength(CHECKLIST_TEMPLATES.length);
  });

  it('tracks completion in the list summary', async () => {
    const id = await checklistService.createFromTemplate('shopping');
    const { items } = (await checklistService.getChecklistWithItems(id))!;
    await checklistService.setItemCompleted(id, items[0].id, true);

    const [summary] = await checklistService.listChecklists();
    expect(summary.totalItems).toBe(5);
    expect(summary.completedItems).toBe(1);
    expect(checklistService.completionPercent(summary.completedItems, summary.totalItems)).toBe(20);
  });

  it('appends new items after existing ones', async () => {
    const id = await checklistService.createFromTemplate('work');
    await checklistService.addItem(id, '  Review PRs  ');
    const { items } = (await checklistService.getChecklistWithItems(id))!;
    expect(items[items.length - 1].label).toBe('Review PRs');
  });

  it('rejects empty items and titles', async () => {
    const id = await checklistService.createBlankChecklist('Packing');
    await expect(checklistService.addItem(id, '   ')).rejects.toBeInstanceOf(ValidationError);
    await expect(checklistService.createBlankChecklist('')).rejects.toBeInstanceOf(ValidationError);
  });

  it('cascades item deletion when a checklist is deleted', async () => {
    const id = await checklistService.createFromTemplate('travel');
    await checklistService.deleteChecklist(id);
    const remaining = await mockDb.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM checklist_items WHERE checklist_id = ?',
      [id],
    );
    expect(remaining?.n).toBe(0);
    expect(await checklistService.getChecklistWithItems(id)).toBeNull();
  });

  it('renames and deletes individual items', async () => {
    const id = await checklistService.createBlankChecklist('Errands');
    const itemId = await checklistService.addItem(id, 'Post office');
    await checklistService.renameItem(id, itemId, 'Bank');
    let { items } = (await checklistService.getChecklistWithItems(id))!;
    expect(items.map((i) => i.label)).toEqual(['Bank']);
    await checklistService.deleteItem(id, itemId);
    ({ items } = (await checklistService.getChecklistWithItems(id))!);
    expect(items).toHaveLength(0);
  });
});
