import {
  applyBasisPoints,
  divRoundHalfUp,
  formatBasisPoints,
  formatPaise,
  paiseToPlainString,
  parsePercentToBasisPoints,
  parseRupeesToPaise,
} from '@/utils/currencyUtils';

describe('parseRupeesToPaise', () => {
  it('parses plain, decimal, and formatted amounts', () => {
    expect(parseRupeesToPaise('149.50')).toEqual({ ok: true, value: 14950 });
    expect(parseRupeesToPaise('₹1,23,456.7')).toEqual({ ok: true, value: 12345670 });
    expect(parseRupeesToPaise(' 500 ')).toEqual({ ok: true, value: 50000 });
    expect(parseRupeesToPaise('0.05')).toEqual({ ok: true, value: 5 });
  });

  it('rejects invalid, negative, over-precise, and huge amounts', () => {
    for (const bad of ['', 'abc', '-5', '1.234', '1.2.3', '1e5']) {
      expect(parseRupeesToPaise(bad).ok).toBe(false);
    }
    expect(parseRupeesToPaise('99999999999').ok).toBe(false);
  });
});

describe('parsePercentToBasisPoints', () => {
  it('parses whole and decimal percentages', () => {
    expect(parsePercentToBasisPoints('18')).toEqual({ ok: true, value: 1800 });
    expect(parsePercentToBasisPoints('8.75%')).toEqual({ ok: true, value: 875 });
  });

  it('enforces the maximum', () => {
    expect(parsePercentToBasisPoints('101').ok).toBe(false);
    expect(parsePercentToBasisPoints('150', 200).ok).toBe(true);
  });
});

describe('formatPaise', () => {
  it('uses Indian lakh/crore grouping', () => {
    expect(formatPaise(0)).toBe('₹0.00');
    expect(formatPaise(99900)).toBe('₹999.00');
    expect(formatPaise(123456)).toBe('₹1,234.56');
    expect(formatPaise(12345678)).toBe('₹1,23,456.78');
    expect(formatPaise(1234567890)).toBe('₹1,23,45,678.90');
    expect(formatPaise(-5000)).toBe('-₹50.00');
    expect(formatPaise(5000, { symbol: false })).toBe('50.00');
  });
});

describe('helpers', () => {
  it('rounds half away from zero', () => {
    expect(divRoundHalfUp(5n, 2n)).toBe(3n);
    expect(divRoundHalfUp(4n, 3n)).toBe(1n);
    expect(divRoundHalfUp(-5n, 2n)).toBe(-3n);
  });

  it('applies basis points without floating point', () => {
    expect(applyBasisPoints(1000_00, 1800)).toBe(180_00);
    expect(applyBasisPoints(1, 5000)).toBe(1);
  });

  it('formats plain strings and percentages', () => {
    expect(paiseToPlainString(1037918)).toBe('10379.18');
    expect(paiseToPlainString(5)).toBe('0.05');
    expect(formatBasisPoints(1800)).toBe('18%');
    expect(formatBasisPoints(875)).toBe('8.75%');
    expect(formatBasisPoints(250)).toBe('2.5%');
  });
});
