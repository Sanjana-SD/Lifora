import { CategoryScope } from '@/types/category';

export interface SeedCategory {
  scope: CategoryScope;
  name: string;
  colorHex: string;
  sortOrder: number;
}

// Matches docs/Lifora_Complete_PRD.md Module 2.3 (calendar) and
// Module 4.D (finance) category lists. Seeded once, on first launch
// (see database/migrations/001_initial.ts). is_system = 1 for all of
// these; the user cannot delete them, only reassign items off them
// (custom categories are a V1.1 enhancement, PRD Section 12).
export const DEFAULT_CATEGORIES: SeedCategory[] = [
  // Calendar scope
  { scope: 'calendar', name: 'Personal', colorHex: '#2F6F4F', sortOrder: 0 },
  { scope: 'calendar', name: 'College', colorHex: '#2563EB', sortOrder: 1 },
  { scope: 'calendar', name: 'Work', colorHex: '#7C3AED', sortOrder: 2 },
  { scope: 'calendar', name: 'Meetings', colorHex: '#D97706', sortOrder: 3 },
  { scope: 'calendar', name: 'Birthdays', colorHex: '#DB2777', sortOrder: 4 },
  { scope: 'calendar', name: 'Other', colorHex: '#64748B', sortOrder: 5 },

  // Finance scope
  { scope: 'finance', name: 'Food', colorHex: '#D97706', sortOrder: 0 },
  { scope: 'finance', name: 'Shopping', colorHex: '#DB2777', sortOrder: 1 },
  { scope: 'finance', name: 'Transportation', colorHex: '#2563EB', sortOrder: 2 },
  { scope: 'finance', name: 'Education', colorHex: '#0891B2', sortOrder: 3 },
  { scope: 'finance', name: 'Entertainment', colorHex: '#7C3AED', sortOrder: 4 },
  { scope: 'finance', name: 'Healthcare', colorHex: '#DC2626', sortOrder: 5 },
  { scope: 'finance', name: 'Bills and Utilities', colorHex: '#B45309', sortOrder: 6 },
  { scope: 'finance', name: 'Rent', colorHex: '#92400E', sortOrder: 7 },
  { scope: 'finance', name: 'Subscriptions', colorHex: '#9333EA', sortOrder: 8 },
  { scope: 'finance', name: 'Travel', colorHex: '#0D9488', sortOrder: 9 },
  { scope: 'finance', name: 'Salary', colorHex: '#2F6F4F', sortOrder: 10 },
  { scope: 'finance', name: 'Business Income', colorHex: '#15803D', sortOrder: 11 },
  { scope: 'finance', name: 'Transfers', colorHex: '#475569', sortOrder: 12 },
  { scope: 'finance', name: 'Other', colorHex: '#64748B', sortOrder: 13 },
  { scope: 'finance', name: 'Uncategorized', colorHex: '#94A3B8', sortOrder: 14 },
];
