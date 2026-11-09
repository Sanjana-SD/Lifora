import {
  calculateDiscount,
  calculateEmi,
  calculateGst,
  customSplitStatus,
  splitEqually,
} from '@/utils/financialCalculators';

describe('calculateEmi', () => {
  it('matches the standard formula to the paisa (PRD 6.1: ₹5,00,000 @ 9% for 60 months)', () => {
    const result = calculateEmi(500_000_00, 900, 60);
    expect(result.emiPaise).toBe(10_379_18);
    expect(result.totalPaymentPaise).toBe(10_379_18 * 60);
    expect(result.totalInterestPaise).toBe(10_379_18 * 60 - 500_000_00);
  });

  it('matches other well-known reference values', () => {
    // ₹10,00,000 @ 8.5% for 20 years (home loan) = ₹8,678.23
    expect(calculateEmi(1_000_000_00, 850, 240).emiPaise).toBe(8_678_23);
    // ₹1,00,000 @ 12% for 12 months = ₹8,884.88
    expect(calculateEmi(100_000_00, 1200, 12).emiPaise).toBe(8_884_88);
  });

  it('handles a 0% rate as simple division', () => {
    const result = calculateEmi(120_000_00, 0, 12);
    expect(result.emiPaise).toBe(10_000_00);
    expect(result.totalInterestPaise).toBe(0);
  });

  it('rejects invalid inputs', () => {
    expect(() => calculateEmi(0, 900, 12)).toThrow(RangeError);
    expect(() => calculateEmi(100_00, 900, 0)).toThrow(RangeError);
    expect(() => calculateEmi(100_00, -1, 12)).toThrow(RangeError);
  });
});

describe('calculateGst', () => {
  it('adds GST on top of an exclusive amount', () => {
    const r = calculateGst(1000_00, 1800, 'add');
    expect(r).toEqual({ basePaise: 1000_00, gstPaise: 180_00, totalPaise: 1180_00, cgstPaise: 90_00, sgstPaise: 90_00 });
  });

  it('extracts the base from an inclusive amount', () => {
    const r = calculateGst(1180_00, 1800, 'remove');
    expect(r.basePaise).toBe(1000_00);
    expect(r.gstPaise).toBe(180_00);
  });

  it('always sums exactly, even when rounding is involved', () => {
    for (const amount of [1, 99, 333_33, 1_234_567]) {
      for (const rate of [500, 1200, 1800, 2800, 250]) {
        for (const mode of ['add', 'remove'] as const) {
          const r = calculateGst(amount, rate, mode);
          expect(r.basePaise + r.gstPaise).toBe(r.totalPaise);
          expect(r.cgstPaise + r.sgstPaise).toBe(r.gstPaise);
        }
      }
    }
  });
});

describe('calculateDiscount', () => {
  it('applies a percentage discount', () => {
    expect(calculateDiscount(2499_00, { kind: 'percent', basisPoints: 2000 })).toEqual({
      discountPaise: 499_80,
      finalPaise: 1999_20,
    });
  });

  it('applies a flat discount', () => {
    expect(calculateDiscount(500_00, { kind: 'flat', paise: 150_00 }).finalPaise).toBe(350_00);
  });

  it('allows 100% off but never more than the price', () => {
    expect(calculateDiscount(500_00, { kind: 'percent', basisPoints: 10_000 }).finalPaise).toBe(0);
    expect(() => calculateDiscount(500_00, { kind: 'flat', paise: 600_00 })).toThrow(RangeError);
  });
});

describe('splitEqually', () => {
  it('allocates leftover paise deterministically so shares sum exactly (PRD 6.1)', () => {
    const r = splitEqually(1000_00, 3);
    expect(r.sharesPaise).toEqual([333_34, 333_33, 333_33]);
    expect(r.sharesPaise.reduce((a, b) => a + b, 0)).toBe(1000_00);
  });

  it('adds a tip before splitting', () => {
    const r = splitEqually(1000_00, 4, 1000);
    expect(r.tipPaise).toBe(100_00);
    expect(r.grandTotalPaise).toBe(1100_00);
    expect(r.sharesPaise).toEqual([275_00, 275_00, 275_00, 275_00]);
  });

  it('always sums to the grand total', () => {
    for (const total of [1, 7, 100_01, 999_99]) {
      for (const people of [1, 2, 3, 7, 50]) {
        const r = splitEqually(total, people, 500);
        expect(r.sharesPaise.reduce((a, b) => a + b, 0)).toBe(r.grandTotalPaise);
        expect(Math.max(...r.sharesPaise) - Math.min(...r.sharesPaise)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('requires at least one person', () => {
    expect(() => splitEqually(100_00, 0)).toThrow(RangeError);
  });
});

describe('customSplitStatus', () => {
  it('reports remaining and over-assigned amounts', () => {
    expect(customSplitStatus(1000_00, [400_00, 500_00])).toEqual({ assignedPaise: 900_00, remainingPaise: 100_00 });
    expect(customSplitStatus(1000_00, [600_00, 500_00]).remainingPaise).toBe(-100_00);
    expect(customSplitStatus(1000_00, [500_00, 500_00]).remainingPaise).toBe(0);
  });
});
