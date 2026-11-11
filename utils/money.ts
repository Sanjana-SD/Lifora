// All money in LIFORA is integer paise (PRD 4.H): 1 rupee = 100 paise.
// Parsing works on the digit string itself, never through a float, so
// "149.50" is exactly 14950 and sums never drift (0.1 + 0.2 problems).

/** ₹99,99,99,999.99, comfortably inside Number.MAX_SAFE_INTEGER. */
export const MAX_AMOUNT_PAISE = 99_99_99_999_99;

export type AmountParseResult = { ok: true; paise: number } | { ok: false; error: string };

export function parseAmountToPaise(input: string): AmountParseResult {
  const cleaned = input.replace(/[₹,\s]/g, '');
  if (cleaned === '') return { ok: false, error: 'Enter an amount.' };
  const match = /^(\d*)(?:\.(\d*))?$/.exec(cleaned);
  if (!match || (match[1] === '' && !match[2])) {
    return { ok: false, error: 'Enter a valid amount, like 149.50.' };
  }
  const [, whole, fraction = ''] = match;
  if (fraction.length > 2) return { ok: false, error: 'Amounts can have at most 2 decimal places.' };
  if (whole.replace(/^0+/, '').length > 10) return { ok: false, error: 'That amount is too large.' };

  const paise = Number(whole || '0') * 100 + Number(fraction.padEnd(2, '0'));
  if (paise <= 0) return { ok: false, error: 'Amount must be more than zero.' };
  if (paise > MAX_AMOUNT_PAISE) return { ok: false, error: 'That amount is too large.' };
  return { ok: true, paise };
}

/**
 * Input-layer filter for the amount field: keeps digits and a single
 * decimal point with at most two digits after it, so a stray paste or
 * keyboard can't produce something unparseable.
 */
export function sanitizeAmountInput(text: string): string {
  let seenPoint = false;
  let decimals = 0;
  let out = '';
  for (const ch of text) {
    if (ch >= '0' && ch <= '9') {
      if (seenPoint) {
        if (decimals === 2) continue;
        decimals += 1;
      }
      out += ch;
    } else if (ch === '.' && !seenPoint) {
      seenPoint = true;
      out += ch;
    }
  }
  return out;
}

/** Indian digit grouping: 12,34,567. */
function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

interface FormatOptions {
  /** 'auto' drops ".00" on whole-rupee amounts (for compact tiles). */
  decimals?: 'always' | 'auto';
  /** Prefix "+" for positive values (income, net gain). */
  signed?: boolean;
}

/** 14950 → "₹149.50"; -250000 → "−₹2,500.00". */
export function formatPaise(paise: number, { decimals = 'always', signed = false }: FormatOptions = {}): string {
  const abs = Math.abs(Math.trunc(paise));
  const rupees = groupIndian(String(Math.floor(abs / 100)));
  const fraction = String(abs % 100).padStart(2, '0');
  const body = decimals === 'auto' && fraction === '00' ? `₹${rupees}` : `₹${rupees}.${fraction}`;
  if (paise < 0) return `−${body}`;
  if (signed && paise > 0) return `+${body}`;
  return body;
}

/** For editing: 14950 → "149.50", 150000 → "1500". */
export function paiseToInputString(paise: number): string {
  const rupees = Math.floor(paise / 100);
  const fraction = paise % 100;
  return fraction === 0 ? String(rupees) : `${rupees}.${String(fraction).padStart(2, '0')}`;
}

/** Whole-percentage share, safe for a zero total. */
export function percentOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
