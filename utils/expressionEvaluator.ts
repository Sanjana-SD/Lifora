// A small recursive-descent evaluator for the basic calculator. It never
// uses eval() (PRD Module 6.A): input is tokenized against a fixed
// grammar of digits, '.', + − × ÷ and %, and computed with exact BigInt
// fractions, so 0.1 + 0.2 is exactly 0.3.

export class EvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EvaluationError';
  }
}

export const DIVIDE_BY_ZERO_MESSAGE = 'Cannot divide by zero';
const MAX_ABS_RESULT = 10n ** 15n;

interface Fraction {
  n: bigint;
  d: bigint; // always > 0, always reduced
}

const abs = (x: bigint) => (x < 0n ? -x : x);

function gcd(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function fraction(n: bigint, d: bigint): Fraction {
  if (d === 0n) throw new EvaluationError(DIVIDE_BY_ZERO_MESSAGE);
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}

const add = (a: Fraction, b: Fraction) => fraction(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a: Fraction, b: Fraction) => fraction(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a: Fraction, b: Fraction) => fraction(a.n * b.n, a.d * b.d);
const div = (a: Fraction, b: Fraction) => {
  if (b.n === 0n) throw new EvaluationError(DIVIDE_BY_ZERO_MESSAGE);
  return fraction(a.n * b.d, a.d * b.n);
};
const HUNDRED: Fraction = { n: 100n, d: 1n };

function parseDecimal(text: string): Fraction {
  if (text === '.' || text === '') throw new EvaluationError('Invalid number');
  const [whole, frac = ''] = text.split('.');
  return fraction(BigInt((whole || '0') + frac), 10n ** BigInt(frac.length));
}

type Op = '+' | '-' | '*' | '/';
type Token = { type: 'num'; value: Fraction } | { type: 'op'; op: Op } | { type: 'percent' };

const OP_CHARS: Record<string, Op> = {
  '+': '+',
  '-': '-',
  '−': '-',
  '×': '*',
  '*': '*',
  '÷': '/',
  '/': '/',
};

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expression.length) {
    const ch = expression[i];
    if (ch === ' ') {
      i++;
    } else if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < expression.length && /[0-9.]/.test(expression[j])) j++;
      const text = expression.slice(i, j);
      if ((text.match(/\./g) ?? []).length > 1) throw new EvaluationError('Invalid number');
      tokens.push({ type: 'num', value: parseDecimal(text) });
      i = j;
    } else if (ch in OP_CHARS) {
      tokens.push({ type: 'op', op: OP_CHARS[ch] });
      i++;
    } else if (ch === '%') {
      tokens.push({ type: 'percent' });
      i++;
    } else {
      throw new EvaluationError('Invalid expression');
    }
  }
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(private readonly tokens: Token[]) {}

  parse(): Fraction {
    if (this.tokens.length === 0) throw new EvaluationError('Incomplete expression');
    const value = this.expression();
    if (this.pos < this.tokens.length) throw new EvaluationError('Invalid expression');
    return value;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private peekOp(...ops: Op[]): Op | null {
    const t = this.peek();
    return t?.type === 'op' && ops.includes(t.op) ? t.op : null;
  }

  // expression := term (('+' | '-') term)*
  // "200 + 10%" means 200 + 10% of 200, like phone calculators.
  private expression(): Fraction {
    let left = this.term().value;
    let op: Op | null;
    while ((op = this.peekOp('+', '-'))) {
      this.pos++;
      const right = this.term();
      const rhs = right.barePercent ? mul(left, div(right.barePercent, HUNDRED)) : right.value;
      left = op === '+' ? add(left, rhs) : sub(left, rhs);
    }
    return left;
  }

  // term := factor (('*' | '/') factor)*
  private term(): { value: Fraction; barePercent: Fraction | null } {
    const first = this.factor();
    let value = first.value;
    let factors = 1;
    let op: Op | null;
    while ((op = this.peekOp('*', '/'))) {
      this.pos++;
      const next = this.factor().value;
      value = op === '*' ? mul(value, next) : div(value, next);
      factors++;
    }
    return { value, barePercent: factors === 1 ? first.percentOf : null };
  }

  // factor := '-'? number '%'?
  private factor(): { value: Fraction; percentOf: Fraction | null } {
    let negative = false;
    if (this.peekOp('-')) {
      negative = true;
      this.pos++;
    }
    const t = this.peek();
    if (t?.type !== 'num') throw new EvaluationError('Incomplete expression');
    this.pos++;
    let value = negative ? fraction(-t.value.n, t.value.d) : t.value;
    let percentOf: Fraction | null = null;
    if (this.peek()?.type === 'percent') {
      this.pos++;
      percentOf = value;
      value = div(value, HUNDRED);
    }
    return { value, percentOf };
  }
}

/** Rounds to at most `maxFractionDigits` decimals (half away from zero) and trims zeros. */
function formatFraction(value: Fraction, maxFractionDigits: number): string {
  const negative = value.n < 0n;
  const scale = 10n ** BigInt(maxFractionDigits);
  const scaled = (2n * abs(value.n) * scale + value.d) / (2n * value.d);
  if (scaled === 0n) return '0';
  const whole = scaled / scale;
  const frac = (scaled % scale).toString().padStart(maxFractionDigits, '0').replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole}${frac ? `.${frac}` : ''}`;
}

/**
 * Evaluates a calculator expression and returns a plain decimal string
 * ("-12.5"), rounded to 10 decimal places for display. Throws
 * EvaluationError with a user-facing message on invalid input.
 */
export function evaluateExpression(expression: string, maxFractionDigits = 10): string {
  const result = new Parser(tokenize(expression)).parse();
  if (abs(result.n) >= MAX_ABS_RESULT * result.d) throw new EvaluationError('Result is too large');
  return formatFraction(result, maxFractionDigits);
}
