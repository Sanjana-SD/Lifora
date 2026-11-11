import { formatPaise, parseAmountToPaise, paiseToInputString, percentOf, sanitizeAmountInput } from '@/utils/money';

const paise = (input: string) => {
  const r = parseAmountToPaise(input);
  return r.ok ? r.paise : r.error;
};

describe('parseAmountToPaise', () => {
  it.each([
    ['149.50', 14950],
    ['149.5', 14950],
    ['₹1,234.05', 123405],
    ['0.01', 1],
    ['.5', 50],
    ['10.', 1000],
    ['007', 700],
    ['  99.99 ', 9999],
  ])('%s → %d paise', (input, expected) => {
    expect(paise(input)).toBe(expected);
  });

  it('avoids float drift: 0.1 + 0.2 is exactly 30 paise, and 99.99 + 0.01 is exactly ₹100.00 (PRD 4.1)', () => {
    expect((paise('0.1') as number) + (paise('0.2') as number)).toBe(30);
    expect(formatPaise((paise('99.99') as number) + (paise('0.01') as number))).toBe('₹100.00');
  });

  it.each([
    ['', 'Enter an amount.'],
    ['0', 'Amount must be more than zero.'],
    ['0.00', 'Amount must be more than zero.'],
    ['-5', 'Enter a valid amount, like 149.50.'],
    ['12abc', 'Enter a valid amount, like 149.50.'],
    ['.', 'Enter a valid amount, like 149.50.'],
    ['1.2.3', 'Enter a valid amount, like 149.50.'],
    ['1.234', 'Amounts can have at most 2 decimal places.'],
    ['100000000000', 'That amount is too large.'],
  ])('rejects %p', (input, error) => {
    expect(paise(input)).toBe(error);
  });
});

describe('sanitizeAmountInput', () => {
  it.each([
    ['12.345', '12.34'],
    ['1.2.3', '1.23'],
    ['₹1,500', '1500'],
    ['-40', '40'],
    ['abc', ''],
  ])('%s → %s', (input, expected) => {
    expect(sanitizeAmountInput(input)).toBe(expected);
  });
});

describe('formatPaise', () => {
  it('uses Indian digit grouping', () => {
    expect(formatPaise(1)).toBe('₹0.01');
    expect(formatPaise(123456789)).toBe('₹12,34,567.89');
    expect(formatPaise(100000000)).toBe('₹10,00,000.00');
    expect(formatPaise(99900)).toBe('₹999.00');
  });

  it('can drop .00 and show signs', () => {
    expect(formatPaise(150000, { decimals: 'auto' })).toBe('₹1,500');
    expect(formatPaise(150050, { decimals: 'auto' })).toBe('₹1,500.50');
    expect(formatPaise(-2500, { decimals: 'auto' })).toBe('−₹25');
    expect(formatPaise(2500, { signed: true })).toBe('+₹25.00');
    expect(formatPaise(0, { signed: true })).toBe('₹0.00');
  });
});

describe('paiseToInputString and percentOf', () => {
  it('round-trips for editing', () => {
    for (const p of [1, 50, 14950, 150000, 123405]) {
      const r = parseAmountToPaise(paiseToInputString(p));
      expect(r.ok && r.paise).toBe(p);
    }
  });

  it('handles a zero total', () => {
    expect(percentOf(5, 0)).toBe(0);
    expect(percentOf(1, 3)).toBe(33);
  });
});
