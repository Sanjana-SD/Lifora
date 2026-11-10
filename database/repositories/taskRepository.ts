import { isPriority } from '@/constants/priorities';
import type { Task, TaskDraft } from '@/types/task';
import { getDatabase } from '../database';

interface TaskRow {
  id: number;
  title: string;
  description: string;
  deadline_at: string | null;
  deadline_has_time: number;
  notify: number;
  priority: string;
  category_id: number | null;
  is_completed: number;
  completed_at: string | null;
}

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

function mapRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    deadline: row.deadline_at ? new Date(row.deadline_at) : null,
    deadlineHasTime: row.deadline_has_time === 1,
    notify: row.notify === 1,
    priority: isPriority(row.priority) ? row.priority : 'medium',
    categoryId: row.category_id,
    isCompleted: row.is_completed === 1,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
  };
}

function draftParams(draft: TaskDraft) {
  return [
    draft.title,
    draft.description,
    draft.deadline ? draft.deadline.toISOString() : null,
    draft.deadline && draft.deadlineHasTime ? 1 : 0,
    draft.deadline && draft.notify ? 1 : 0,
    draft.priority,
    draft.categoryId,
  ];
}

export async function listTasks(): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskRow>('SELECT * FROM tasks ORDER BY is_completed ASC, deadline_at IS NULL, deadline_at ASC, id DESC');
  return rows.map(mapRow);
}

export async function getTask(id: number): Promise<Task | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TaskRow>('SELECT * FROM tasks WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function insertTask(draft: TaskDraft): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO tasks (title, description, deadline_at, deadline_has_time, notify, priority, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    draftParams(draft),
  );
  return result.lastInsertRowId;
}

export async function updateTask(id: number, draft: TaskDraft): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE tasks SET title = ?, description = ?, deadline_at = ?, deadline_has_time = ?, notify = ?, priority = ?, category_id = ?, updated_at = ${NOW} WHERE id = ?`,
    [...draftParams(draft), id],
  );
}

export async function setTaskCompleted(id: number, completed: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE tasks SET is_completed = ?, completed_at = ${completed ? NOW : 'NULL'}, updated_at = ${NOW} WHERE id = ?`,
    [completed ? 1 : 0, id],
  );
}

export async function deleteTask(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
}
