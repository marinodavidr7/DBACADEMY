import type { CellPrimitive, SheetCells } from '../utils/excelEngine';
import { isExcelError, toNumeric } from '../utils/excelEngine';

export interface ExcelArgumentDoc {
  name: string;
  required: boolean;
  description: string;
}

export interface ExcelFunctionExplanation {
  name: string;
  syntax: string;
  summary: string;
  arguments: ExcelArgumentDoc[];
  pitfall: string;
}

export interface ExcelPracticalExample {
  id: string;
  title: string;
  functionTag: string;
  scenario: string;
  formula: string;
  expectedResult: string;
  targetCell: string;
  sheet: SheetCells;
  secondarySheet?: { name: string; cells: SheetCells };
  supportsFilter?: boolean;
  filterColumn?: 'A' | 'B' | 'C' | 'D';
  filterValue?: string;
}

export interface ExcelExercise {
  id: string;
  number: number;
  functionTag: string;
  title: string;
  prompt: string;
  hint: string;
  targetCell: string;
  solutionFormula: string;
  initialSheet: SheetCells;
  secondarySheet?: { name: string; cells: SheetCells };
  supportsFilter?: boolean;
  filterColumn?: 'A' | 'B' | 'C' | 'D';
  filterValue?: string;
  validate: (formulaRaw: string, computedValue: CellPrimitive) => { ok: boolean; feedback: string };
}

export interface ExcelLessonCurriculum {
  lessonId: string;
  introduction: string;
  keyTakeaways: string[];
  functions: ExcelFunctionExplanation[];
  examples: ExcelPracticalExample[];
  exercises: ExcelExercise[];
}

export function checkNumericFormula(
  formulaRaw: string,
  computedValue: CellPrimitive,
  expectedValue: number,
  fnRegex: RegExp,
  successMsg: string,
  failMsg: string,
  tolerance = 0.02
): { ok: boolean; feedback: string } {
  const f = formulaRaw.trim();
  if (!f.startsWith('=')) {
    return {
      ok: false,
      feedback: 'Recuerda iniciar toda fórmula con el signo igual (=).',
    };
  }
  if (isExcelError(computedValue)) {
    return {
      ok: false,
      feedback: `La fórmula devolvió el error ${String(computedValue)}. ${failMsg}`,
    };
  }
  const num = toNumeric(computedValue);
  if (fnRegex.test(f) && num !== null && Math.abs(num - expectedValue) <= tolerance) {
    return { ok: true, feedback: successMsg };
  }
  return {
    ok: false,
    feedback: `${failMsg} (Valor actual: ${String(computedValue || 'vacío')}).`,
  };
}

export function checkTextFormula(
  formulaRaw: string,
  computedValue: CellPrimitive,
  expectedText: string,
  fnRegex: RegExp,
  successMsg: string,
  failMsg: string
): { ok: boolean; feedback: string } {
  const f = formulaRaw.trim();
  if (!f.startsWith('=')) {
    return {
      ok: false,
      feedback: 'Recuerda iniciar toda fórmula con el signo igual (=).',
    };
  }
  if (
    fnRegex.test(f) &&
    String(computedValue).trim().toLowerCase() === expectedText.trim().toLowerCase()
  ) {
    return { ok: true, feedback: successMsg };
  }
  return {
    ok: false,
    feedback: `${failMsg} (Resultado actual: ${String(computedValue || 'vacío')}).`,
  };
}
