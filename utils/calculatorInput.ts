import { EvaluationError, evaluateExpression } from './expressionEvaluator';

export const OPERATOR_KEYS = ['+', '−', '×', '÷'] as const;
export type OperatorKey = (typeof OPERATOR_KEYS)[number];
export type CalcKey =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '.' | '%' | 'C' | '⌫' | '='
  | OperatorKey;

export const MAX_DIGITS_PER_NUMBER = 15;

export interface CalcState {
  expression: string;
  /** True right after '=', so the next digit starts a fresh calculation. */
  justEvaluated: boolean;
  error: string | null;
}

export interface Evaluation {
  expression: string;
  result: string;
}

export const INITIAL_CALC_STATE: CalcState = { expression: '', justEvaluated: false, error: null };

const isOperator = (ch: string | undefined): ch is OperatorKey =>
  ch !== undefined && (OPERATOR_KEYS as readonly string[]).includes(ch);

/** The number currently being typed, e.g. "12.5" in "3×12.5" (sign excluded). */
function currentNumber(expression: string): string {
  const match = expression.match(/[0-9.]*$/);
  return match ? match[0] : '';
}

const toDisplayMinus = (value: string) => value.replace(/^-/, '−');

function stripTrailingOperator(expression: string): string {
  return isOperator(expression.slice(-1)) ? expression.slice(0, -1) : expression;
}

/** Live result shown under the expression while typing; null when there's nothing to show. */
export function previewResult(expression: string): string | null {
  const trimmed = stripTrailingOperator(expression);
  if (!/[+−×÷%]/.test(trimmed.replace(/^−/, ''))) return null;
  try {
    return toDisplayMinus(evaluateExpression(trimmed));
  } catch {
    return null;
  }
}

export function pressKey(state: CalcState, key: CalcKey): { state: CalcState; evaluation?: Evaluation } {
  const base = { ...state, error: null };
  const expr = state.expression;
  const last = expr.slice(-1);

  if (key === 'C') return { state: INITIAL_CALC_STATE };

  if (key === '⌫') {
    return { state: { ...base, expression: expr.slice(0, -1), justEvaluated: false } };
  }

  if (/^[0-9]$/.test(key)) {
    if (state.justEvaluated) return { state: { ...base, expression: key, justEvaluated: false } };
    if (last === '%') return { state: base };
    const current = currentNumber(expr);
    if (current === '0') {
      return { state: key === '0' ? base : { ...base, expression: expr.slice(0, -1) + key } };
    }
    if (current.replace('.', '').length >= MAX_DIGITS_PER_NUMBER) return { state: base };
    return { state: { ...base, expression: expr + key } };
  }

  if (key === '.') {
    if (state.justEvaluated) return { state: { ...base, expression: '0.', justEvaluated: false } };
    if (last === '%') return { state: base };
    const current = currentNumber(expr);
    if (current.includes('.')) return { state: base };
    return { state: { ...base, expression: expr + (current === '' ? '0.' : '.') } };
  }

  if (isOperator(key)) {
    const continuing = { ...base, justEvaluated: false };
    if (expr === '' || expr === '−') {
      return { state: key === '−' ? { ...continuing, expression: '−' } : base };
    }
    // Repeated operators collapse to the last one pressed (PRD 6.A).
    if (isOperator(last)) return { state: { ...continuing, expression: expr.slice(0, -1) + key } };
    return { state: { ...continuing, expression: expr + key } };
  }

  if (key === '%') {
    if (expr === '' || isOperator(last) || last === '%' || expr === '−') return { state: base };
    return { state: { ...base, expression: expr + '%', justEvaluated: false } };
  }

  // '='
  const toEvaluate = stripTrailingOperator(expr);
  if (toEvaluate === '' || toEvaluate === '−' || state.justEvaluated) return { state: base };
  try {
    const result = toDisplayMinus(evaluateExpression(toEvaluate));
    return {
      state: { expression: result, justEvaluated: true, error: null },
      evaluation: { expression: toEvaluate, result },
    };
  } catch (e) {
    const message = e instanceof EvaluationError ? e.message : 'Invalid expression';
    return { state: { ...base, expression: toEvaluate, error: message } };
  }
}
