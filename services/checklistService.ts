import { findTemplate } from '@/constants/checklistTemplates';
import * as checklistRepository from '@/database/repositories/checklistRepository';
import type { Checklist, ChecklistItem, ChecklistSummary } from '@/types/checklist';
import { requireText } from '@/utils/validationUtils';

export const CHECKLIST_TITLE_MAX_LENGTH = 80;
export const CHECKLIST_ITEM_MAX_LENGTH = 200;

export function completionPercent(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((Math.min(completed, total) / total) * 100);
}

export function isComplete(summary: Pick<ChecklistSummary, 'completedItems' | 'totalItems'>): boolean {
  return summary.totalItems > 0 && summary.completedItems >= summary.totalItems;
}

export function listChecklists(): Promise<ChecklistSummary[]> {
  return checklistRepository.listChecklistSummaries();
}

export async function getChecklistWithItems(
  id: number,
): Promise<{ checklist: Checklist; items: ChecklistItem[] } | null> {
  const checklist = await checklistRepository.getChecklist(id);
  if (!checklist) return null;
  const items = await checklistRepository.listChecklistItems(id);
  return { checklist, items };
}

export async function createBlankChecklist(title: string): Promise<number> {
  const clean = requireText(title, 'Checklist title', CHECKLIST_TITLE_MAX_LENGTH);
  return checklistRepository.insertChecklist(clean, null, []);
}

export async function createFromTemplate(templateKey: string): Promise<number> {
  const template = findTemplate(templateKey);
  if (!template) throw new Error(`Unknown checklist template: ${templateKey}`);
  return checklistRepository.insertChecklist(template.title, template.key, template.items);
}

export async function renameChecklist(id: number, title: string): Promise<void> {
  const clean = requireText(title, 'Checklist title', CHECKLIST_TITLE_MAX_LENGTH);
  await checklistRepository.renameChecklist(id, clean);
}

export function deleteChecklist(id: number): Promise<void> {
  return checklistRepository.deleteChecklist(id);
}

export async function addItem(checklistId: number, label: string): Promise<number> {
  const clean = requireText(label, 'Item', CHECKLIST_ITEM_MAX_LENGTH);
  const itemId = await checklistRepository.insertChecklistItem(checklistId, clean);
  await checklistRepository.touchChecklist(checklistId);
  return itemId;
}

export async function renameItem(checklistId: number, itemId: number, label: string): Promise<void> {
  const clean = requireText(label, 'Item', CHECKLIST_ITEM_MAX_LENGTH);
  await checklistRepository.updateChecklistItemLabel(itemId, clean);
  await checklistRepository.touchChecklist(checklistId);
}

export async function setItemCompleted(checklistId: number, itemId: number, completed: boolean): Promise<void> {
  await checklistRepository.setChecklistItemCompleted(itemId, completed);
  await checklistRepository.touchChecklist(checklistId);
}

export async function deleteItem(checklistId: number, itemId: number): Promise<void> {
  await checklistRepository.deleteChecklistItem(itemId);
  await checklistRepository.touchChecklist(checklistId);
}
