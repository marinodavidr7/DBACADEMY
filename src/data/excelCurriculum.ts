import { EXCEL_CURRICULUM_MOD0 } from './excelCurriculumMod0';
import { EXCEL_CURRICULUM_FOUNDATIONS } from './excelCurriculumFoundations';
import { EXCEL_CURRICULUM_MOD1A } from './excelCurriculumMod1A';
import { EXCEL_CURRICULUM_MOD1B } from './excelCurriculumMod1B';
import type { ExcelLessonCurriculum } from './excelCurriculumTypes';

export type {
  ExcelArgumentDoc,
  ExcelExercise,
  ExcelFunctionExplanation,
  ExcelLessonCurriculum,
  ExcelPracticalExample,
} from './excelCurriculumTypes';

export const EXCEL_CURRICULUM: Record<string, ExcelLessonCurriculum> = {
  ...EXCEL_CURRICULUM_MOD0,
  ...EXCEL_CURRICULUM_MOD1A,
  ...EXCEL_CURRICULUM_MOD1B,
  ...EXCEL_CURRICULUM_FOUNDATIONS,
  // Aliases for Módulo 4: Funciones Matemáticas y Estadísticas
  'les-excel-4-1': EXCEL_CURRICULUM_MOD1A['les-excel-1-1'],
  'les-excel-4-2': EXCEL_CURRICULUM_MOD1A['les-excel-1-2'],
  'les-excel-4-3': EXCEL_CURRICULUM_MOD1A['les-excel-1-3'],
  'les-excel-4-4': EXCEL_CURRICULUM_MOD1A['les-excel-1-4'],
  'les-excel-4-5': EXCEL_CURRICULUM_MOD1A['les-excel-1-5'],
  'les-excel-4-6': EXCEL_CURRICULUM_MOD1A['les-excel-1-6'],
  'les-excel-4-7': EXCEL_CURRICULUM_MOD1B['les-excel-1-7'],
  'les-excel-4-8': EXCEL_CURRICULUM_MOD1B['les-excel-1-8'],
  'les-excel-4-9': EXCEL_CURRICULUM_MOD1B['les-excel-1-9'],
  'les-excel-4-10': EXCEL_CURRICULUM_MOD1B['les-excel-1-10'],
  'les-excel-4-11': EXCEL_CURRICULUM_MOD1B['les-excel-1-11'],
  'les-excel-4-12': EXCEL_CURRICULUM_MOD1B['les-excel-1-12'],
  'les-excel-4-13': EXCEL_CURRICULUM_MOD1B['les-excel-1-13'],
};
