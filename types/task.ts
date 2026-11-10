import type { Priority } from '@/constants/priorities';

export interface Task {
  id: number;
  title: string;
  description: string;
  deadline: Date | null;
  deadlineHasTime: boolean;
  notify: boolean;
  priority: Priority;
  categoryId: number | null;
  isCompleted: boolean;
  completedAt: Date | null;
}

export interface TaskDraft {
  title: string;
  description: string;
  deadline: Date | null;
  deadlineHasTime: boolean;
  notify: boolean;
  priority: Priority;
  categoryId: number | null;
}
