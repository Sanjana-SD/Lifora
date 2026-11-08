export interface ChecklistTemplate {
  key: string;
  title: string;
  items: string[];
}

// The five starter templates from PRD Module 5.B.
export const CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  {
    key: 'shopping',
    title: 'Shopping List',
    items: ['Milk', 'Bread', 'Eggs', 'Vegetables', 'Fruits'],
  },
  {
    key: 'college',
    title: 'College Work',
    items: ['Review lecture notes', 'Finish assignment', 'Submit lab record', 'Prepare for quiz'],
  },
  {
    key: 'personal',
    title: 'Personal Tasks',
    items: ['Pay bills', 'Call family', 'Exercise', 'Clean room'],
  },
  {
    key: 'travel',
    title: 'Travel Checklist',
    items: ['ID / Passport', 'Tickets', 'Phone charger', 'Clothes', 'Toiletries', 'Medicines'],
  },
  {
    key: 'work',
    title: 'Work Checklist',
    items: ['Check email', 'Update task tracker', 'Attend stand-up', 'Plan tomorrow'],
  },
];

export function findTemplate(key: string): ChecklistTemplate | undefined {
  return CHECKLIST_TEMPLATES.find((t) => t.key === key);
}
