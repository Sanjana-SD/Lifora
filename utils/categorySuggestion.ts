import type { TransactionType } from '@/types/transaction';

// PRD 4.D: keyword → category rules, matched against the lower-cased
// description. Suggests the *category* only, never the payment method.
// Names must match the finance categories seeded in defaultCategories.ts.
// (The PRD's user-editable rule table arrives with CSV import, Phase 7.)
interface Rule {
  category: string;
  keywords: string[];
  type: TransactionType;
}

export const CATEGORY_RULES: Rule[] = [
  { category: 'Salary', type: 'income', keywords: ['salary', 'payroll', 'stipend'] },
  { category: 'Business Income', type: 'income', keywords: ['invoice', 'client', 'freelance', 'consulting'] },
  { category: 'Food', type: 'expense', keywords: ['swiggy', 'zomato', 'restaurant', 'cafe', 'coffee', 'lunch', 'dinner', 'breakfast', 'grocer', 'bigbasket', 'blinkit', 'zepto', 'pizza', 'canteen', 'mess'] },
  { category: 'Transportation', type: 'expense', keywords: ['uber', 'ola', 'rapido', 'metro', 'petrol', 'diesel', 'fuel', 'auto', 'cab', 'bus', 'parking', 'toll'] },
  { category: 'Travel', type: 'expense', keywords: ['irctc', 'train', 'flight', 'indigo', 'makemytrip', 'goibibo', 'hotel', 'airbnb', 'trip'] },
  { category: 'Subscriptions', type: 'expense', keywords: ['netflix', 'spotify', 'prime', 'hotstar', 'youtube premium', 'subscription', 'icloud', 'google one'] },
  { category: 'Bills and Utilities', type: 'expense', keywords: ['electricity', 'water bill', 'gas', 'internet', 'broadband', 'wifi', 'recharge', 'mobile bill', 'jio', 'airtel', 'bsnl', 'dth'] },
  { category: 'Rent', type: 'expense', keywords: ['rent', 'landlord', 'pg', 'hostel'] },
  { category: 'Healthcare', type: 'expense', keywords: ['pharmacy', 'medicine', 'doctor', 'hospital', 'clinic', 'apollo', 'medplus', 'lab test', 'dental'] },
  { category: 'Education', type: 'expense', keywords: ['tuition', 'course', 'udemy', 'coursera', 'books', 'exam fee', 'college fee', 'school fee', 'stationery'] },
  { category: 'Entertainment', type: 'expense', keywords: ['movie', 'pvr', 'inox', 'bookmyshow', 'concert', 'game', 'steam'] },
  { category: 'Shopping', type: 'expense', keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa', 'clothes', 'shoes', 'mall'] },
];

const isWordChar = (ch: string | undefined) => ch !== undefined && /[a-z0-9]/.test(ch);

/**
 * A keyword matches at the start of a word, so "rent" finds "Rent" and
 * "rental" but not "parent", and "ola" finds "Ola cab" but not "Coca-Cola".
 * Keywords of three letters or fewer must be whole words ("bus" ≠ "business").
 */
function matchesAtWordStart(text: string, keyword: string): boolean {
  let from = 0;
  for (;;) {
    const at = text.indexOf(keyword, from);
    if (at === -1) return false;
    const startsWord = !isWordChar(text[at - 1]);
    const endsOk = keyword.length > 3 || !isWordChar(text[at + keyword.length]);
    if (startsWord && endsOk) return true;
    from = at + 1;
  }
}

/**
 * The best-matching category name for a description, or null. Only rules
 * for the transaction's own type apply; the longest matching keyword wins
 * ("youtube premium" beats a bare "prime").
 */
export function suggestCategoryName(description: string, type: TransactionType): string | null {
  const text = description.toLowerCase().trim();
  if (text === '') return null;
  let best: { category: string; length: number } | null = null;
  for (const rule of CATEGORY_RULES) {
    if (rule.type !== type) continue;
    for (const keyword of rule.keywords) {
      if (matchesAtWordStart(text, keyword) && (!best || keyword.length > best.length)) {
        best = { category: rule.category, length: keyword.length };
      }
    }
  }
  return best?.category ?? null;
}
