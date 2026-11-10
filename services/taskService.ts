import { endOfDay, endOfWeek, isSameDay, isWithinInterval, startOfWeek } from 'date-fns';

import { PRIORITY_RANK } from '@/constants/priorities';
import * as taskRepository from '@/database/repositories/taskRepository';
import type { Task, TaskDraft } from '@/types/task';
import { requireText } from '@/utils/validationUtils';
import { syncNotifications } from './notificationService';

export const TASK_TITLE_MAX_LENGTH = 120;

export type TaskStatusFilter = 'all' | 'pending' | 'overdue' | 'completed';
export type TaskSort = 'deadline' | 'priority';

/** A task without a deadline can never be overdue (PRD 3.3). */
export function isOverdue(task: Pick<Task, 'isCompleted' | 'deadline'>, now: Date = new Date()): boolean {
  return !task.isCompleted && task.deadline !== null && task.deadline < now;
}

/** Date-only deadlines are stored as the end of that local day. */
export function normalizeDeadline(date: Date, hasTime: boolean): Date {
  return hasTime ? date : endOfDay(date);
}

export function filterTasks(tasks: Task[], status: TaskStatusFilter, search: string, now: Date = new Date()): Task[] {
  const term = search.trim().toLowerCase();
  return tasks.filter((t) => {
    if (status === 'pending' && t.isCompleted) return false;
    if (status === 'completed' && !t.isCompleted) return false;
    if (status === 'overdue' && !isOverdue(t, now)) return false;
    if (term && !`${t.title}\n${t.description}`.toLowerCase().includes(term)) return false;
    return true;
  });
}

const deadlineValue = (t: Task) => (t.deadline ? t.deadline.getTime() : Number.POSITIVE_INFINITY);

/** Pending before completed; then by deadline (no deadline last) or by priority. */
export function sortTasks(tasks: Task[], by: TaskSort): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    if (by === 'priority') {
      const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (p !== 0) return p;
    }
    const d = deadlineValue(a) - deadlineValue(b);
    if (d !== 0) return d;
    return by === 'deadline' ? PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] : a.id - b.id;
  });
}

/** Home dashboard counts (PRD Module 1.2). */
export function summarizeTasks(tasks: Task[], now: Date = new Date()) {
  const week = { start: startOfWeek(now), end: endOfWeek(now) };
  const due = (t: Task, test: (d: Date) => boolean) => t.deadline !== null && test(t.deadline);
  return {
    pending: tasks.filter((t) => !t.isCompleted).length,
    overdue: tasks.filter((t) => isOverdue(t, now)).length,
    dueToday: tasks.filter((t) => !t.isCompleted && due(t, (d) => isSameDay(d, now))).length,
    completedToday: tasks.filter((t) => t.completedAt && isSameDay(t.completedAt, now)).length,
    dueThisWeek: tasks.filter((t) => !t.isCompleted && due(t, (d) => isWithinInterval(d, week))).length,
  };
}

function validate(draft: TaskDraft): TaskDraft {
  return {
    ...draft,
    title: requireText(draft.title, 'Title', TASK_TITLE_MAX_LENGTH),
    description: draft.description.trim(),
    deadline: draft.deadline ? normalizeDeadline(draft.deadline, draft.deadlineHasTime) : null,
    notify: draft.deadline !== null && draft.notify,
  };
}

export function listTasks(): Promise<Task[]> {
  return taskRepository.listTasks();
}

export function getTask(id: number): Promise<Task | null> {
  return taskRepository.getTask(id);
}

export async function createTask(draft: TaskDraft): Promise<number> {
  const id = await taskRepository.insertTask(validate(draft));
  void syncNotifications();
  return id;
}

export async function updateTask(id: number, draft: TaskDraft): Promise<void> {
  await taskRepository.updateTask(id, validate(draft));
  void syncNotifications();
}

export async function setTaskCompleted(id: number, completed: boolean): Promise<void> {
  await taskRepository.setTaskCompleted(id, completed);
  void syncNotifications();
}

export async function deleteTask(id: number): Promise<void> {
  await taskRepository.deleteTask(id);
  void syncNotifications();
}
