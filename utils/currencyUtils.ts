// Money is always integer paise (PRD Section 4.H / 8.1). Rupee strings
// exist only at the input and display edges.

export const MAX_AMOUNT_PAISE = 1_000_000_000 * 100; // ₹100 crore

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

const MONEY_PATTERN = /^\d+(\.\d{0,2})?$/;
const PERCENT_PATTERN = /^\d+(\.\d{0,2})?$/;

function clean(input: string): string {
  return input.replace(/[₹,\s]/g, '').replace(/^Rs\.?/i, '');
}

/**
 * Form-field wrapper: an empty field is "not entered yet" (no value, no
 * error) rather than invalid, so forms don't open with error messages.
 */
export function parseField<T>(
  text: string,
  parse: (text: string) => ParseResult<T>,
): { value: T | null; error: string | null } {
  if (text.trim() === '') return { value: null, error: null };
  const result = parse(text);
  return result.ok ? { value: result.value, error: null } : { value: null, error: result.error };
}

/** Whole numbers only, within [min, max]. */
export function parseWholeNumber(input: string, min: number, max: number, noun: string): ParseResult<number> {
  const text = input.trim();
  if (!/^\d+$/.test(text)) return { ok: false, error: `Enter a whole number of ${noun}.` };
  const value = Number(text);
  if (value < min) return { ok: false, error: `Enter at least ${min} ${noun}.` };
  if (value > max) return { ok: false, error: `Enter at most ${max} ${noun}.` };
  return { ok: true, value };
}

/** "1,234.5" -> 123450. Rejects negatives and more than 2 decimals. */
export function parseRupeesToPaise(input: string): ParseResult<number> {
  const text = clean(input);
  if (text === '') return { ok: false, error: 'Enter an amount.' };
  if (!MONEY_PATTERN.test(text)) {
    return { ok: false, error: 'Enter a valid amount with up to 2 decimal places.' };
  }
  const [whole, fraction = ''] = text.split('.');
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(paise) || paise > MAX_AMOUNT_PAISE) {
    return { ok: false, error: 'That amount is too large.' };
  }
  return { ok: true, value: paise };
}

/** "18" -> 1800, "2.5" -> 250. Basis points keep percentage math in integers. */
export function parsePercentToBasisPoints(input: string, maxPercent = 100): ParseResult<number> {
  const text = input.replace(/[%\s]/g, '');
  if (text === '') return { ok: false, error: 'Enter a percentage.' };
  if (!PERCENT_PATTERN.test(text)) {
    return { ok: false, error: 'Enter a valid percentage with up to 2 decimal places.' };
  }
  const [whole, fraction = ''] = text.split('.');
  const bp = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (bp > maxPercent * 100) return { ok: false, error: `Percentage can't exceed ${maxPercent}%.` };
  return { ok: true, value: bp };
}

/** Integer division rounded half away from zero, exact via BigInt. */
export function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new RangeError('Division by zero');
  const negative = numerator < 0n !== denominator < 0n;
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const q = (2n * n + d) / (2n * d);
  return negative ? -q : q;
}

/** paise * basisPoints / 10000, rounded half up. */
export function applyBasisPoints(paise: number, basisPoints: number): number {
  return Number(divRoundHalfUp(BigInt(paise) * BigInt(basisPoints), 10_000n));
}

function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
}

/** 12345678 -> "₹1,23,456.78" (Indian lakh/crore grouping). */
export function formatPaise(paise: number, options: { symbol?: boolean } = {}): string {
  const { symbol = true } = options;
  const negative = paise < 0;
  const abs = Math.abs(Math.round(paise));
  const rupees = Math.floor(abs / 100).toString();
  const fraction = (abs % 100).toString().padStart(2, '0');
  return `${negative ? '-' : ''}${symbol ? '₹' : ''}${groupIndian(rupees)}.${fraction}`;
}

/** Plain decimal string for copying/sharing: 1037918 -> "10379.18". */
export function paiseToPlainString(paise: number): string {
  const negative = paise < 0;
  const abs = Math.abs(paise);
  return `${negative ? '-' : ''}${Math.floor(abs / 100)}.${(abs % 100).toString().padStart(2, '0')}`;
}

export function formatBasisPoints(bp: number): string {
  const whole = Math.floor(bp / 100);
  const fraction = bp % 100;
  if (fraction === 0) return `${whole}%`;
  return `${whole}.${fraction.toString().padStart(2, '0').replace(/0$/, '')}%`;
}
