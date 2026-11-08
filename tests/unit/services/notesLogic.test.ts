import { completionPercent, isComplete } from '@/services/checklistService';
import { bodySnippet, displayTitle, isDraftEmpty } from '@/services/noteService';
import { requireText, ValidationError } from '@/utils/validationUtils';

describe('displayTitle (PRD 5.A untitled rule)', () => {
  it('uses the title when present', () => {
    expect(displayTitle({ title: '  Plans ', body: 'x' })).toBe('Plans');
  });

  it('falls back to the first non-blank body line', () => {
    expect(displayTitle({ title: '', body: '\n\n  Buy milk  \nand eggs' })).toBe('Buy milk');
  });

  it('falls back to "Untitled Note" when both are empty', () => {
    expect(displayTitle({ title: ' ', body: '' })).toBe('Untitled Note');
  });
});

describe('bodySnippet', () => {
  it('does not repeat the first line when it is acting as the title', () => {
    expect(bodySnippet({ title: '', body: 'Buy milk\nand eggs' })).toBe('and eggs');
  });

  it('joins lines and truncates long bodies', () => {
    const snippet = bodySnippet({ title: 'T', body: 'a'.repeat(300) }, 50);
    expect(snippet).toHaveLength(50);
    expect(snippet.endsWith('…')).toBe(true);
  });
});

describe('isDraftEmpty', () => {
  it('treats whitespace-only content as empty', () => {
    expect(isDraftEmpty({ title: '  ', body: '\n\t' })).toBe(true);
    expect(isDraftEmpty({ title: '', body: 'x' })).toBe(false);
  });
});

describe('completionPercent', () => {
  it('handles empty checklists without dividing by zero', () => {
    expect(completionPercent(0, 0)).toBe(0);
  });

  it('rounds to a whole percent', () => {
    expect(completionPercent(1, 3)).toBe(33);
    expect(completionPercent(2, 3)).toBe(67);
    expect(completionPercent(7, 7)).toBe(100);
  });

  it('never exceeds 100', () => {
    expect(completionPercent(5, 3)).toBe(100);
  });
});

describe('isComplete', () => {
  it('is false for an empty checklist', () => {
    expect(isComplete({ completedItems: 0, totalItems: 0 })).toBe(false);
  });

  it('is true when every item is done', () => {
    expect(isComplete({ completedItems: 4, totalItems: 4 })).toBe(true);
  });
});

describe('requireText', () => {
  it('trims and returns valid text', () => {
    expect(requireText('  hi  ', 'Item', 10)).toBe('hi');
  });

  it('rejects empty and over-long text', () => {
    expect(() => requireText('   ', 'Item', 10)).toThrow(ValidationError);
    expect(() => requireText('a'.repeat(11), 'Item', 10)).toThrow('10 characters or fewer');
  });
});
