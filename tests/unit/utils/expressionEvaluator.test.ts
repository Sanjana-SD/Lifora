import { DIVIDE_BY_ZERO_MESSAGE, EvaluationError, evaluateExpression } from '@/utils/expressionEvaluator';

const ev = evaluateExpression;

describe('evaluateExpression', () => {
  it('does basic arithmetic with correct precedence', () => {
    expect(ev('2+3×4')).toBe('14');
    expect(ev('10−4−3')).toBe('3');
    expect(ev('100÷10÷2')).toBe('5');
    expect(ev('2×3+4×5')).toBe('26');
  });

  it('is exact with decimals (no floating-point artifacts)', () => {
    expect(ev('0.1+0.2')).toBe('0.3');
    expect(ev('1.1×1.1')).toBe('1.21');
    expect(ev('0.3−0.1')).toBe('0.2');
  });

  it('rounds non-terminating results to 10 decimals', () => {
    expect(ev('1÷3')).toBe('0.3333333333');
    expect(ev('2÷3')).toBe('0.6666666667');
  });

  it('reports divide by zero instead of Infinity (PRD 6.1)', () => {
    expect(() => ev('10÷0')).toThrow(DIVIDE_BY_ZERO_MESSAGE);
    expect(() => ev('5÷(0)'.replace(/[()]/g, ''))).toThrow(EvaluationError);
    expect(() => ev('5÷0.0')).toThrow(DIVIDE_BY_ZERO_MESSAGE);
  });

  it('handles percentages like a phone calculator', () => {
    expect(ev('50%')).toBe('0.5');
    expect(ev('200+10%')).toBe('220');
    expect(ev('200−10%')).toBe('180');
    expect(ev('200×10%')).toBe('20');
    expect(ev('200÷50%')).toBe('400');
  });

  it('supports a leading minus and negative results', () => {
    expect(ev('−5+3')).toBe('-2');
    expect(ev('3−5')).toBe('-2');
    expect(ev('−2×−3')).toBe('6');
  });

  it('accepts ASCII operator aliases', () => {
    expect(ev('6*7')).toBe('42');
    expect(ev('8/2-1')).toBe('3');
  });

  it('rejects anything outside the calculator grammar (no code execution)', () => {
    expect(() => ev('alert(1)')).toThrow(EvaluationError);
    expect(() => ev('2+2;process.exit()')).toThrow(EvaluationError);
    expect(() => ev('1.2.3')).toThrow('Invalid number');
    expect(() => ev('5+')).toThrow('Incomplete expression');
    expect(() => ev('')).toThrow('Incomplete expression');
    expect(() => ev('5 5')).toThrow(EvaluationError);
  });

  it('refuses results too large to display', () => {
    expect(() => ev('999999999999999×999999999999999')).toThrow('Result is too large');
  });
});
