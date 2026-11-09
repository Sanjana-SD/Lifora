import * as historyRepository from '@/database/repositories/calculationHistoryRepository';
import type { CalculationRecord, CalculatorType } from '@/types/calculation';

// Bounded so the table can't grow forever (PRD Section 16, storage efficiency).
export const HISTORY_LIMIT = 200;

export async function recordCalculation(
  calculatorType: CalculatorType,
  inputs: Record<string, unknown>,
  resultSummary: string,
  resultValue: string,
): Promise<void> {
  await historyRepository.insertCalculation(calculatorType, inputs, resultSummary, resultValue);
  await historyRepository.pruneCalculations(HISTORY_LIMIT);
}

export function listHistory(): Promise<CalculationRecord[]> {
  return historyRepository.listCalculations(HISTORY_LIMIT);
}

export function deleteEntry(id: number): Promise<void> {
  return historyRepository.deleteCalculation(id);
}

export function clearHistory(): Promise<void> {
  return historyRepository.clearCalculations();
}
