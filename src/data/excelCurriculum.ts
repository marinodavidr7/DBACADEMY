import { EXCEL_CURRICULUM_MOD0 } from './excelCurriculumMod0';
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
};
