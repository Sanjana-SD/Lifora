export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function isPriority(value: string): value is Priority {
  return (PRIORITIES as readonly string[]).includes(value);
}
