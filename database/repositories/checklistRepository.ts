import type { Checklist, ChecklistItem, ChecklistSummary } from '@/types/checklist';
import { getDatabase } from '../database';

interface ChecklistRow {
  id: number;
  title: string;
  template_key: string | null;
  created_at: string;
  updated_at: string;
}

interface ChecklistSummaryRow extends ChecklistRow {
  total_items: number;
  completed_items: number;
}

interface ChecklistItemRow {
  id: number;
  checklist_id: number;
  label: string;
  is_completed: number;
  sort_order: number;
}

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

function mapChecklist(row: ChecklistRow): Checklist {
  return {
    id: row.id,
    title: row.title,
    templateKey: row.template_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapItem(row: ChecklistItemRow): ChecklistItem {
  return {
    id: row.id,
    checklistId: row.checklist_id,
    label: row.label,
    isCompleted: row.is_completed === 1,
    sortOrder: row.sort_order,
  };
}

export async function listChecklistSummaries(): Promise<ChecklistSummary[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ChecklistSummaryRow>(
    `SELECT c.*,
            COUNT(i.id) AS total_items,
            COALESCE(SUM(i.is_completed), 0) AS completed_items
       FROM checklists c
       LEFT JOIN checklist_items i ON i.checklist_id = c.id
      GROUP BY c.id
      ORDER BY c.updated_at DESC, c.id DESC`,
  );
  return rows.map((row) => ({
    ...mapChecklist(row),
    totalItems: row.total_items,
    completedItems: row.completed_items,
  }));
}

export async function getChecklist(id: number): Promise<Checklist | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ChecklistRow>('SELECT * FROM checklists WHERE id = ?', [id]);
  return row ? mapChecklist(row) : null;
}

export async function listChecklistItems(checklistId: number): Promise<ChecklistItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ChecklistItemRow>(
    'SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY sort_order ASC, id ASC',
    [checklistId],
  );
  return rows.map(mapItem);
}

export async function insertChecklist(
  title: string,
  templateKey: string | null,
  itemLabels: string[],
): Promise<number> {
  const db = await getDatabase();
  let checklistId = 0;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync('INSERT INTO checklists (title, template_key) VALUES (?, ?)', [
      title,
      templateKey,
    ]);
    checklistId = result.lastInsertRowId;
    for (let i = 0; i < itemLabels.length; i++) {
      await db.runAsync('INSERT INTO checklist_items (checklist_id, label, sort_order) VALUES (?, ?, ?)', [
        checklistId,
        itemLabels[i],
        i,
      ]);
    }
  });
  return checklistId;
}

export async function renameChecklist(id: number, title: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE checklists SET title = ?, updated_at = ${NOW} WHERE id = ?`, [title, id]);
}

export async function touchChecklist(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE checklists SET updated_at = ${NOW} WHERE id = ?`, [id]);
}

export async function deleteChecklist(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM checklists WHERE id = ?', [id]);
}

export async function insertChecklistItem(checklistId: number, label: string): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO checklist_items (checklist_id, label, sort_order)
     VALUES (?, ?, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM checklist_items WHERE checklist_id = ?))`,
    [checklistId, label, checklistId],
  );
  return result.lastInsertRowId;
}

export async function updateChecklistItemLabel(itemId: number, label: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE checklist_items SET label = ? WHERE id = ?', [label, itemId]);
}

export async function setChecklistItemCompleted(itemId: number, completed: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE checklist_items SET is_completed = ? WHERE id = ?', [completed ? 1 : 0, itemId]);
}

export async function deleteChecklistItem(itemId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM checklist_items WHERE id = ?', [itemId]);
}
