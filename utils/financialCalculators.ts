import { applyBasisPoints, divRoundHalfUp } from './currencyUtils';

// All amounts are integer paise and all rates are basis points
// (1% = 100 bp), so results are exact to the paisa (PRD Module 6.B).

export const MAX_TENURE_MONTHS = 600;
export const MAX_SPLIT_PEOPLE = 50;

export interface EmiResult {
  emiPaise: number;
  totalPaymentPaise: number;
  totalInterestPaise: number;
  months: number;
}

/** Standard reducing-balance EMI: P·r·(1+r)^n / ((1+r)^n − 1), r = monthly rate. */
export function calculateEmi(principalPaise: number, annualRateBp: number, months: number): EmiResult {
  if (principalPaise <= 0 || months <= 0 || annualRateBp < 0) {
    throw new RangeError('Principal and tenure must be positive and the rate non-negative.');
  }
  let emiPaise: number;
  if (annualRateBp === 0) {
    emiPaise = Number(divRoundHalfUp(BigInt(principalPaise), BigInt(months)));
  } else {
    const r = annualRateBp / 10_000 / 12;
    const growth = Math.pow(1 + r, months);
    emiPaise = Math.round((principalPaise * r * growth) / (growth - 1));
  }
  const totalPaymentPaise = emiPaise * months;
  return {
    emiPaise,
    totalPaymentPaise,
    totalInterestPaise: totalPaymentPaise - principalPaise,
    months,
  };
}

export type GstMode = 'add' | 'remove';

export interface GstResult {
  basePaise: number;
  gstPaise: number;
  totalPaise: number;
  /** Intra-state split; cgst + sgst always equals gst exactly. */
  cgstPaise: number;
  sgstPaise: number;
}

/**
 * 'add': amount excludes GST, compute the tax on top.
 * 'remove': amount already includes GST, extract the base.
 * Base + GST always equals the total exactly.
 */
export function calculateGst(amountPaise: number, rateBp: number, mode: GstMode): GstResult {
  let basePaise: number;
  let totalPaise: number;
  if (mode === 'add') {
    basePaise = amountPaise;
    totalPaise = amountPaise + applyBasisPoints(amountPaise, rateBp);
  } else {
    totalPaise = amountPaise;
    basePaise = Number(divRoundHalfUp(BigInt(amountPaise) * 10_000n, BigInt(10_000 + rateBp)));
  }
  const gstPaise = totalPaise - basePaise;
  const cgstPaise = Number(divRoundHalfUp(BigInt(gstPaise), 2n));
  return { basePaise, gstPaise, totalPaise, cgstPaise, sgstPaise: gstPaise - cgstPaise };
}

export type DiscountInput = { kind: 'percent'; basisPoints: number } | { kind: 'flat'; paise: number };

export interface DiscountResult {
  discountPaise: number;
  finalPaise: number;
}

export function calculateDiscount(originalPaise: number, discount: DiscountInput): DiscountResult {
  const discountPaise =
    discount.kind === 'percent' ? applyBasisPoints(originalPaise, discount.basisPoints) : discount.paise;
  if (discountPaise > originalPaise) throw new RangeError("Discount can't exceed the original price.");
  return { discountPaise, finalPaise: originalPaise - discountPaise };
}

export interface EqualSplitResult {
  tipPaise: number;
  grandTotalPaise: number;
  sharesPaise: number[];
}

/**
 * Splits a bill so the shares always sum to the grand total exactly. Any
 * leftover paise go one each to the first people, deterministically:
 * ₹1,000 / 3 -> ₹333.34, ₹333.33, ₹333.33 (PRD 6.1).
 */
export function splitEqually(totalPaise: number, people: number, tipBp = 0): EqualSplitResult {
  if (!Number.isInteger(people) || people < 1) throw new RangeError('At least one person is required.');
  const tipPaise = applyBasisPoints(totalPaise, tipBp);
  const grandTotalPaise = totalPaise + tipPaise;
  const base = Math.floor(grandTotalPaise / people);
  const remainder = grandTotalPaise - base * people;
  const sharesPaise = Array.from({ length: people }, (_, i) => base + (i < remainder ? 1 : 0));
  return { tipPaise, grandTotalPaise, sharesPaise };
}

export interface CustomSplitStatus {
  assignedPaise: number;
  /** Positive: still to assign. Negative: over-assigned. Zero: balanced. */
  remainingPaise: number;
}

export function customSplitStatus(grandTotalPaise: number, amountsPaise: number[]): CustomSplitStatus {
  const assignedPaise = amountsPaise.reduce((sum, a) => sum + a, 0);
  return { assignedPaise, remainingPaise: grandTotalPaise - assignedPaise };
}
