import { INITIAL_CALC_STATE, pressKey, previewResult, type CalcKey, type CalcState } from '@/utils/calculatorInput';

function type(keys: CalcKey[], from: CalcState = INITIAL_CALC_STATE) {
  let state = from;
  let lastEvaluation;
  for (const key of keys) {
    const out = pressKey(state, key);
    state = out.state;
    if (out.evaluation) lastEvaluation = out.evaluation;
  }
  return { state, lastEvaluation };
}

const keys = (s: string) => Array.from(s) as CalcKey[];

describe('pressKey', () => {
  it('builds and evaluates an expression', () => {
    const { state, lastEvaluation } = type(keys('12×3='));
    expect(state.expression).toBe('36');
    expect(state.justEvaluated).toBe(true);
    expect(lastEvaluation).toEqual({ expression: '12×3', result: '36' });
  });

  it('collapses repeated operators to the last one (PRD 6.A)', () => {
    expect(type(keys('5++3')).state.expression).toBe('5+3');
    expect(type(keys('5+×3')).state.expression).toBe('5×3');
  });

  it('allows only one decimal point per number', () => {
    expect(type(keys('1.2.3')).state.expression).toBe('1.23');
    expect(type(keys('1.2+3.4.5')).state.expression).toBe('1.2+3.45');
  });

  it('starts a bare decimal with a zero', () => {
    expect(type(keys('.5')).state.expression).toBe('0.5');
    expect(type(keys('2+.5')).state.expression).toBe('2+0.5');
  });

  it('prevents leading zeros', () => {
    expect(type(keys('0007')).state.expression).toBe('7');
    expect(type(keys('5+007')).state.expression).toBe('5+7');
    expect(type(keys('0.05')).state.expression).toBe('0.05');
  });

  it('only allows minus as the first key', () => {
    expect(type(keys('×5')).state.expression).toBe('5');
    expect(type(keys('−5')).state.expression).toBe('−5');
  });

  it('caps each number at 15 digits', () => {
    const { state } = type(keys('12345678901234567'));
    expect(state.expression).toBe('123456789012345');
  });

  it('shows divide by zero as an error and stays usable', () => {
    const { state } = type(keys('10÷0='));
    expect(state.error).toBe('Cannot divide by zero');
    expect(state.expression).toBe('10÷0');
    const fixed = type(keys('⌫2='), state).state;
    expect(fixed.expression).toBe('5');
    expect(fixed.error).toBeNull();
  });

  it('starts fresh on a digit after "=", but continues on an operator', () => {
    const done = type(keys('2+2=')).state;
    expect(type(keys('7'), done).state.expression).toBe('7');
    expect(type(keys('×3='), done).state.expression).toBe('12');
  });

  it('ignores a trailing operator on "="', () => {
    expect(type(keys('9+=')).state.expression).toBe('9');
  });

  it('carries negative results forward', () => {
    const { state } = type(keys('3−5=+10='));
    expect(state.expression).toBe('8');
  });

  it('backspace and clear', () => {
    expect(type(keys('123⌫')).state.expression).toBe('12');
    expect(type(keys('123C')).state).toEqual(INITIAL_CALC_STATE);
  });

  it('only accepts % after a number', () => {
    expect(type(keys('%')).state.expression).toBe('');
    expect(type(keys('5+%')).state.expression).toBe('5+');
    expect(type(keys('50%%')).state.expression).toBe('50%');
  });
});

describe('previewResult', () => {
  it('shows a live result once there is an operation', () => {
    expect(previewResult('12×3')).toBe('36');
    expect(previewResult('12×3+')).toBe('36');
    expect(previewResult('200+10%')).toBe('220');
  });

  it('adds nothing while only a single number is on screen', () => {
    expect(previewResult('12×')).toBeNull();
  });

  it('is empty for a lone number or an invalid expression', () => {
    expect(previewResult('42')).toBeNull();
    expect(previewResult('')).toBeNull();
    expect(previewResult('5÷0')).toBeNull();
  });
});
