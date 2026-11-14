// Turns the text of a bank statement PDF into draft transactions, on the
// device. Indian bank statements differ in layout, but share structure:
// every transaction row starts with a date, its amounts are money values
// with two decimals, and the last of them is the running balance. The
// direction (money in or out) is taken from, in order of confidence:
// an explicit Cr/Dr marker, the change in running balance, the column the
// amount sits in, and finally narration keywords. A row whose direction
// still can't be told is marked for review rather than guessed (PRD 4.C).

import { format, isValid } from 'date-fns';

export type Channel = 'UPI' | 'NEFT' | 'IMPS' | 'RTGS' | 'ATM' | 'Card' | 'Cheque' | 'Interest' | 'Charges' | 'Other';
export type Direction = 'income' | 'expense';

export interface ParsedRow {
  /** 'yyyy-MM-dd' */
  date: string;
  /** The bank's own description, whitespace-normalized. */
  narration: string;
  /** Who the money went to or came from, cleaned for display ("Swiggy"). */
  counterparty: string;
  channel: Channel;
  /** UPI/UTR/cheque reference, when present. */
  reference: string | null;
  amountPaise: number;
  /** null when the direction couldn't be determined: the user decides. */
  type: Direction | null;
  balancePaise: number | null;
  /** Why the row needs the user's attention, if it does. */
  reviewReason: string | null;
}

export interface ParsedStatement {
  bankName: string | null;
  rows: ParsedRow[];
  openingBalancePaise: number | null;
  /** 'yyyy-MM-dd' of the earliest and latest rows. */
  periodFrom: string | null;
  periodTo: string | null;
}

// ---- Dates

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

const MONTH_NAMES = 'jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec';
const DATE_PATTERN = `(\\d{1,2}[/\\-.]\\d{1,2}[/\\-.](?:\\d{4}|\\d{2})|\\d{1,2}[\\s\\-/](?:${MONTH_NAMES})[a-z]*[\\s\\-/,]+(?:\\d{4}|\\d{2})|\\d{4}-\\d{2}-\\d{2})`;
// A row may begin with a serial number (ICICI: "1 01/11/2026 ...").
const ROW_START = new RegExp(`^(?:\\d{1,4}\\s+)?${DATE_PATTERN}(?![\\d])`, 'i');
const LEADING_DATE = new RegExp(`^${DATE_PATTERN}(?![\\d])\\s*`, 'i');

const fullYear = (y: string) => (y.length === 2 ? 2000 + Number(y) : Number(y));

/** Parses one statement date. Indian statements are day-first. */
export function parseStatementDate(token: string): Date | null {
  const t = token.trim().toLowerCase().replace(/,/g, ' ');
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (m) return makeDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  m = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4}|\d{2})$/.exec(t);
  if (m) return makeDate(fullYear(m[3]), Number(m[2]) - 1, Number(m[1]));
  m = new RegExp(`^(\\d{1,2})[\\s\\-/]+(${MONTH_NAMES})[a-z]*[\\s\\-/]+(\\d{4}|\\d{2})$`).exec(t.replace(/\s+/g, ' '));
  if (m) return makeDate(fullYear(m[3]), MONTHS[m[2]], Number(m[1]));
  return null;
}

function makeDate(year: number, month: number, day: number): Date | null {
  const d = new Date(year, month, day);
  // Rejects 31/02 and the like, which Date would silently roll over.
  return isValid(d) && d.getFullYear() === year && d.getMonth() === month && d.getDate() === day ? d : null;
}

// ---- Money

interface MoneyToken {
  paise: number;
  marker: Direction | null;
  /** Index of the whitespace-separated word it came from. */
  word: number;
}

const MONEY = /^([+-])?(?:INR|Rs\.?|₹)?(\d{1,3}(?:,\d{2,3})+|\d+)\.(\d{2})(?:\(?(Cr|Dr)\)?\.?)?-?$/i;
const MARKER = /^\(?(Cr|Dr)\)?\.?$/i;

function toPaise(whole: string, fraction: string): number {
  return Number(whole.replace(/,/g, '')) * 100 + Number(fraction);
}

/** Money values in a line, with any Cr/Dr marker (attached or as the next word) or sign. */
export function findMoney(text: string): MoneyToken[] {
  const words = text.split(/\s+/).filter(Boolean);
  const tokens: MoneyToken[] = [];
  words.forEach((word, i) => {
    const m = MONEY.exec(word);
    if (!m) return;
    let marker: Direction | null = null;
    const markerText = m[4] ?? MARKER.exec(words[i + 1] ?? '')?.[1];
    if (markerText) marker = markerText.toLowerCase() === 'cr' ? 'income' : 'expense';
    else if (m[1] === '-') marker = 'expense';
    else if (m[1] === '+') marker = 'income';
    tokens.push({ paise: toPaise(m[2], m[3]), marker, word: i });
  });
  return tokens;
}

// ---- Narration → payee, channel, reference

const NOISE = new Set([
  'upi', 'neft', 'imps', 'rtgs', 'dr', 'cr', 'p2a', 'p2m', 'mb', 'ib', 'inb', 'trf', 'transfer', 'to', 'from', 'by',
  'payment', 'pay', 'paid', 'na', 'sent', 'received', 'collect', 'req', 'request', 'upiintent', 'intent', 'mobile',
  'ref', 'txn', 'utr', 'yono', 'onl', 'online', 'debit', 'credit', 'pos', 'ecom', 'card', 'visa', 'rupay',
]);
/** Channel words removed from inside a segment ("POS AMAZON PAY INDIA" → "AMAZON PAY INDIA"). */
const CHANNEL_WORDS = new Set(['upi', 'neft', 'imps', 'rtgs', 'pos', 'ecom', 'card', 'visa', 'rupay', 'dr', 'cr', 'mb', 'ib', 'inb']);
const BANK_CODES = new Set([
  'yesb', 'hdfc', 'sbin', 'icic', 'utib', 'pytm', 'kkbk', 'barb', 'punb', 'cnrb', 'ibkl', 'airp', 'fdrl', 'idib', 'ubin',
  'indb', 'idfb', 'aubl', 'csbk', 'ratn', 'esfb', 'jaka', 'kvbl', 'sibl', 'tmbl', 'ioba', 'mahb', 'ucba', 'psib', 'bkid',
]);

export function detectChannel(narration: string): Channel {
  const n = ` ${narration.toUpperCase()} `;
  if (/[^A-Z]UPI[^A-Z]/.test(n)) return 'UPI';
  if (/[^A-Z]NEFT[^A-Z]/.test(n)) return 'NEFT';
  if (/[^A-Z]IMPS[^A-Z]/.test(n)) return 'IMPS';
  if (/[^A-Z]RTGS[^A-Z]/.test(n)) return 'RTGS';
  if (/[^A-Z](ATM|ATW|NWD|CASH WDL|ATM WDL)[^A-Z]/.test(n)) return 'ATM';
  if (/[^A-Z](POS|ECOM|CARD|VISA|MASTERCARD|RUPAY)[^A-Z]/.test(n)) return 'Card';
  if (/[^A-Z](CHQ|CHEQUE|CLG|CLEARING)[^A-Z]/.test(n)) return 'Cheque';
  if (/[^A-Z](INT\.?PD|INTEREST|INT CREDIT|INT\.CR)[^A-Z]/.test(n)) return 'Interest';
  if (/[^A-Z](CHARGES?|CHGS|FEE|GST|SMS ALERT|AMC|PENALTY)[^A-Z]/.test(n)) return 'Charges';
  return 'Other';
}

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase());

function isNoiseSegment(seg: string): boolean {
  const s = seg.trim();
  if (s.length < 2) return true;
  const lower = s.toLowerCase();
  if (NOISE.has(lower.replace(/[^a-z0-9]/g, ''))) return true;
  if (BANK_CODES.has(lower)) return true;
  if (/^[a-z]{4}0[a-z0-9]{6}$/i.test(s)) return true; // IFSC
  if (s.includes('@')) return true; // UPI handle
  const digits = (s.match(/\d/g) ?? []).length;
  if (digits / s.length >= 0.4) return true; // reference numbers, masked cards
  if (/x{3,}/i.test(s)) return true;
  return (s.match(/[a-z]/gi) ?? []).length < 3;
}

/** Who the money went to or came from, as GPay would show it. */
export function extractCounterparty(narration: string, channel: Channel): string {
  if (channel === 'ATM') return 'ATM withdrawal';
  if (channel === 'Interest') return 'Interest';
  if (channel === 'Charges') return 'Bank charges';

  // Drop transfer prefixes like "TO TRANSFER-" / "BY TRANSFER-" first.
  const body = narration.replace(/^(to|by)\s+transfer[-\s]*/i, '');
  const segments = body.split(/[/\-*|:]+/).map((s) => s.trim()).filter(Boolean);
  for (const seg of segments) {
    // Drop channel words, references and masked card numbers inside the segment first,
    // so "POS 416021XXXXXX1234 AMAZON PAY INDIA" still yields the merchant.
    const cleaned = seg
      .split(/\s+/)
      .filter((w) => !CHANNEL_WORDS.has(w.toLowerCase()) && !/\d{4,}/.test(w) && !/x{3,}/i.test(w) && !w.includes('@'))
      .join(' ');
    if (isNoiseSegment(cleaned)) continue;
    return titleCase(cleaned).slice(0, 60);
  }
  const handle = /([a-z0-9._-]{3,})@[a-z]+/i.exec(narration)?.[1];
  if (handle) return titleCase(handle.replace(/[._-]+/g, ' '));
  return titleCase(narration).slice(0, 60) || 'Bank transaction';
}

export function extractReference(narration: string): string | null {
  const runs = narration.match(/\d{9,}/g);
  if (!runs) return null;
  // The UPI reference is 12 digits; otherwise the longest run (UTR, cheque).
  const upi = runs.find((r) => r.length === 12);
  return (upi ?? runs.sort((a, b) => b.length - a.length)[0]).replace(/^0+(?=\d{9})/, '');
}

const EXPENSE_WORDS = /\b(dr|debit|withdrawal|wdl|atw|nwd|pos|purchase|ecom|emi|charges?|chgs|fee|ach\s?d|nach|si)\b/i;
const INCOME_WORDS = /\b(cr|credit|credited|deposit|salary|sal|interest|int\.?pd|refund|reversal|cashback|by transfer)\b/i;

export function directionFromWords(narration: string): Direction | null {
  const out = EXPENSE_WORDS.test(narration) || /^to\s+transfer/i.test(narration);
  const inc = INCOME_WORDS.test(narration);
  if (out === inc) return null;
  return out ? 'expense' : 'income';
}

// ---- Statement structure

const OPENING = /(opening balance|balance as on|balance b\/?f|brought forward)/i;
const STOP = /^(page\s+\d+|page no|closing balance|statement summary|grand total|total\b|this is a (system|computer)[ -]generated|\*{2,}|end of statement)/i;
const BANKS: [RegExp, string][] = [
  [/state bank of india|\bsbi\b/i, 'State Bank of India'],
  [/hdfc bank/i, 'HDFC Bank'],
  [/icici bank/i, 'ICICI Bank'],
  [/axis bank/i, 'Axis Bank'],
  [/kotak/i, 'Kotak Mahindra Bank'],
  [/punjab national bank/i, 'Punjab National Bank'],
  [/bank of baroda/i, 'Bank of Baroda'],
  [/canara bank/i, 'Canara Bank'],
  [/union bank/i, 'Union Bank of India'],
  [/yes bank/i, 'Yes Bank'],
  [/idfc first/i, 'IDFC FIRST Bank'],
  [/indusind/i, 'IndusInd Bank'],
  [/federal bank/i, 'Federal Bank'],
  [/bank of india/i, 'Bank of India'],
];

interface Block {
  date: Date;
  firstLine: string;
  rest: string[];
  order: number;
}

export function parseStatementText(text: string, now: Date = new Date()): ParsedStatement {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const head = lines.slice(0, 40).join(' ');
  const bankName = BANKS.find(([re]) => re.test(head))?.[1] ?? null;

  const blocks: Block[] = [];
  let current: Block | null = null;
  let openingBalance: number | null = null;
  let openingPending = false;

  for (const line of lines) {
    const start = ROW_START.exec(line);
    const date = start ? parseStatementDate(start[1]) : null;

    if (OPENING.test(line)) {
      // "Opening Balance 25,000.00", or the figure on the next line (summary tables).
      const money = findMoney(line);
      if (money.length > 0) openingBalance ??= money[money.length - 1].paise;
      else openingPending = true;
      current = null;
      continue;
    }
    if (openingPending) {
      const money = findMoney(line);
      if (money.length > 0) {
        openingBalance ??= money[0].paise;
        openingPending = false;
      }
    }
    if (STOP.test(line)) {
      current = null;
      continue;
    }
    if (date && start) {
      current = { date, firstLine: line.slice(start[0].length).trim(), rest: [], order: blocks.length };
      blocks.push(current);
    } else if (current && current.rest.length < 4) {
      current.rest.push(line);
    }
  }

  const drafts = blocks.map((b) => toDraft(b)).filter((d): d is Draft => d !== null);

  // Work through the rows oldest-first so running balances line up.
  const descending = drafts.length > 1 && drafts[0].date > drafts[drafts.length - 1].date;
  const chronological = descending ? [...drafts].reverse() : drafts;
  assignDirections(chronological, openingBalance);

  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const rows: ParsedRow[] = chronological.map((d) => {
    const future = d.date > tomorrow;
    return {
      date: format(d.date, 'yyyy-MM-dd'),
      narration: d.narration,
      counterparty: extractCounterparty(d.narration, d.channel),
      channel: d.channel,
      reference: extractReference(d.narration),
      amountPaise: d.amountPaise,
      type: d.type,
      balancePaise: d.balancePaise,
      reviewReason: future
        ? 'The date is in the future'
        : d.type === null
          ? "Couldn't tell if this is money in or out"
          : null,
    };
  });

  return {
    bankName,
    rows,
    openingBalancePaise: openingBalance,
    periodFrom: rows[0]?.date ?? null,
    periodTo: rows[rows.length - 1]?.date ?? null,
  };
}

interface Draft {
  date: Date;
  narration: string;
  channel: Channel;
  amountPaise: number;
  balancePaise: number | null;
  /** Set as soon as it's known. */
  type: Direction | null;
  /** Weak hint from the column order (withdrawal before deposit). */
  columnHint: Direction | null;
}

function toDraft(block: Block): Draft | null {
  // The value date often follows the transaction date; it isn't narration.
  const firstLine = block.firstLine.replace(LEADING_DATE, '');
  let money = findMoney(firstLine);
  let source = firstLine;
  if (money.length === 0) {
    // Some layouts centre the amounts on a later line of a wrapped row.
    source = [firstLine, ...block.rest].join(' ');
    money = findMoney(source);
  }
  if (money.length === 0) return null;

  let amount: MoneyToken;
  let balance: MoneyToken | null = null;
  let columnHint: Direction | null = null;

  if (money.length === 1) {
    amount = money[0];
  } else {
    balance = money[money.length - 1];
    const a = money[money.length - 2];
    const b = money.length >= 3 ? money[money.length - 3] : null;
    if (b && (a.paise === 0) !== (b.paise === 0)) {
      // Withdrawal and deposit columns, one of them 0.00: Indian banks put withdrawals first.
      amount = b.paise !== 0 ? b : a;
      columnHint = b.paise !== 0 ? 'expense' : 'income';
    } else {
      amount = a;
    }
  }
  if (amount.paise <= 0) return null;

  const moneyWords = new Set(money.map((m) => m.word));
  const narration = [
    source
      .split(/\s+/)
      .filter((w, i) => !moneyWords.has(i) && !MARKER.test(w) && !/^0\.00$/.test(w) && !/^\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}$/.test(w))
      .join(' '),
    ...(source === firstLine ? block.rest : []),
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    date: block.date,
    narration,
    channel: detectChannel(narration),
    amountPaise: amount.paise,
    balancePaise: balance?.paise ?? null,
    type: amount.marker,
    columnHint,
  };
}

function assignDirections(rows: Draft[], openingBalance: number | null): void {
  let previous = openingBalance;
  for (const row of rows) {
    if (row.type === null && previous !== null && row.balancePaise !== null) {
      const change = row.balancePaise - previous;
      if (change === row.amountPaise) row.type = 'income';
      else if (change === -row.amountPaise) row.type = 'expense';
    }
    row.type ??= row.columnHint ?? directionFromWords(row.narration);
    if (row.balancePaise !== null) previous = row.balancePaise;
    else if (previous !== null && row.type) previous += row.type === 'income' ? row.amountPaise : -row.amountPaise;
    else previous = null;
  }
}
