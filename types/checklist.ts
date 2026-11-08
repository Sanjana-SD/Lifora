export interface ChecklistItem {
  id: number;
  checklistId: number;
  label: string;
  isCompleted: boolean;
  sortOrder: number;
}

export interface Checklist {
  id: number;
  title: string;
  templateKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistSummary extends Checklist {
  totalItems: number;
  completedItems: number;
}
