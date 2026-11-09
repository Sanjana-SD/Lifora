import type { CalculationRecord, CalculatorType } from '@/types/calculation';
import { getDatabase } from '../database';

interface HistoryRow {
  id: number;
  calculator_type: CalculatorType;
  input_json: string;
  result_summary: string;
  result_value: string;
  created_at: string;
}

function parseInputs(json: string): Record<string, unknown> {
  try {
    const value = JSON.parse(json);
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function mapRow(row: HistoryRow): CalculationRecord {
  return {
    id: row.id,
    calculatorType: row.calculator_type,
    inputs: parseInputs(row.input_json),
    resultSummary: row.result_summary,
    resultValue: row.result_value,
    createdAt: row.created_at,
  };
}

export async function insertCalculation(
  calculatorType: CalculatorType,
  inputs: Record<string, unknown>,
  resultSummary: string,
  resultValue: string,
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO calculation_history (calculator_type, input_json, result_summary, result_value) VALUES (?, ?, ?, ?)',
    [calculatorType, JSON.stringify(inputs), resultSummary, resultValue],
  );
  return result.lastInsertRowId;
}

export async function listCalculations(limit: number): Promise<CalculationRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<HistoryRow>(
    'SELECT * FROM calculation_history ORDER BY created_at DESC, id DESC LIMIT ?',
    [limit],
  );
  return rows.map(mapRow);
}

/** Keeps only the newest `keep` rows. */
export async function pruneCalculations(keep: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `DELETE FROM calculation_history WHERE id NOT IN (
       SELECT id FROM calculation_history ORDER BY created_at DESC, id DESC LIMIT ?
     )`,
    [keep],
  );
}

export async function deleteCalculation(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM calculation_history WHERE id = ?', [id]);
}

export async function clearCalculations(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM calculation_history');
}
