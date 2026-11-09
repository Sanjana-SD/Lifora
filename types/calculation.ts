export type CalculatorType = 'basic';

export interface CalculationRecord {
  id: number;
  calculatorType: CalculatorType;
  inputs: Record<string, unknown>;
  resultSummary: string;
  resultValue: string;
  createdAt: string;
}
