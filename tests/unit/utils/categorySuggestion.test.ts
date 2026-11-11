import { CATEGORY_RULES, suggestCategoryName } from '@/utils/categorySuggestion';
import { DEFAULT_CATEGORIES } from '@/database/seed/defaultCategories';

describe('suggestCategoryName', () => {
  it.each([
    ['Swiggy order', 'expense', 'Food'],
    ['UBER *TRIP', 'expense', 'Transportation'],
    ['Ola cab to office', 'expense', 'Transportation'],
    ['IRCTC ticket', 'expense', 'Travel'],
    ['Netflix', 'expense', 'Subscriptions'],
    ['YouTube Premium', 'expense', 'Subscriptions'],
    ['Electricity bill', 'expense', 'Bills and Utilities'],
    ['Rent for March', 'expense', 'Rent'],
    ['Salary credit', 'income', 'Salary'],
    ['Client payment', 'income', 'Business Income'],
  ] as const)('%s (%s) → %s', (description, type, expected) => {
    expect(suggestCategoryName(description, type)).toBe(expected);
  });

  it('matches keywords only at the start of a word', () => {
    expect(suggestCategoryName('Coca-Cola', 'expense')).toBeNull();
    expect(suggestCategoryName('Gift for parent', 'expense')).toBeNull();
    expect(suggestCategoryName('Business conference', 'expense')).toBeNull();
    expect(suggestCategoryName('Bus pass', 'expense')).toBe('Transportation');
  });

  it("only applies rules for the transaction's own type", () => {
    expect(suggestCategoryName('Salary', 'expense')).toBeNull();
    expect(suggestCategoryName('Swiggy refund', 'income')).toBeNull();
  });

  it('returns null for empty or unknown descriptions', () => {
    expect(suggestCategoryName('   ', 'expense')).toBeNull();
    expect(suggestCategoryName('Misc', 'expense')).toBeNull();
  });

  it('only suggests categories that are actually seeded', () => {
    const seeded = new Set(DEFAULT_CATEGORIES.filter((c) => c.scope === 'finance').map((c) => c.name));
    for (const rule of CATEGORY_RULES) expect(seeded.has(rule.category)).toBe(true);
  });
});
