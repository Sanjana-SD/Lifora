export type CalculatorType = 'basic' | 'emi' | 'gst' | 'discount' | 'split_bill';

export interface CalculationRecord {
  id: number;
  calculatorType: CalculatorType;
  inputs: Record<string, unknown>;
  resultSummary: string;
  resultValue: string;
  createdAt: string;
}
