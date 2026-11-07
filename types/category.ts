export type CategoryScope = 'calendar' | 'finance';

export interface Category {
  id: number;
  scope: CategoryScope;
  name: string;
  colorHex: string;
  iconKey: string | null;
  isSystem: boolean;
  sortOrder: number;
}
