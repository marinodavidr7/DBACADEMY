import { EXCEL_CURRICULUM_MOD0 } from './excelCurriculumMod0';
import { EXCEL_CURRICULUM_FOUNDATIONS } from './excelCurriculumFoundations';
import { EXTRA_FOUNDATION_EXERCISES } from './excelCurriculumFoundationsExtra';
import { EXCEL_CURRICULUM_MOD1A } from './excelCurriculumMod1A';
import { EXCEL_CURRICULUM_MOD1B } from './excelCurriculumMod1B';
import type { ExcelExercise, ExcelLessonCurriculum } from './excelCurriculumTypes';

export type {
  ExcelArgumentDoc,
  ExcelExercise,
  ExcelFunctionExplanation,
  ExcelLessonCurriculum,
  ExcelPracticalExample,
} from './excelCurriculumTypes';

const PLATFORM_PRACTICES_PER_CHAPTER = 10;

function normalizeLessonExercises(
  lessonId: string,
  base: ExcelLessonCurriculum,
  overrideExercises?: ExcelExercise[]
): ExcelLessonCurriculum {
  const source = overrideExercises ?? base.exercises;
  const exercises = source
    .slice(0, PLATFORM_PRACTICES_PER_CHAPTER)
    .map((ex, idx) => ({
      ...ex,
      number: idx + 1,
    }));
  return {
    ...base,
    lessonId,
    exercises,
  };
}

function mergeFoundation(lessonId: string): ExcelLessonCurriculum {
  const base = EXCEL_CURRICULUM_FOUNDATIONS[lessonId];
  const extras = EXTRA_FOUNDATION_EXERCISES[lessonId] ?? [];
  return normalizeLessonExercises(lessonId, base, [...base.exercises, ...extras]);
}

const mod19 = EXCEL_CURRICULUM_MOD1B['les-excel-1-9'];
const mod110 = EXCEL_CURRICULUM_MOD1B['les-excel-1-10'];

// 5 ejercicios representativos de ENTERO/TRUNCAR/RESIDUO + 5 de POTENCIA/RAIZ/ABS = 10 exactos
const CURATED_4_3_EXERCISES: ExcelExercise[] = [
  mod19.exercises[0],
  mod19.exercises[1],
  mod19.exercises[4],
  mod19.exercises[5],
  mod19.exercises[8],
  mod110.exercises[0],
  mod110.exercises[1],
  mod110.exercises[4],
  mod110.exercises[8],
  mod110.exercises[9],
];

const EXCEL_CURRICULUM_4_3: ExcelLessonCurriculum = normalizeLessonExercises(
  'les-excel-4-3',
  {
    lessonId: 'les-excel-4-3',
    introduction:
      'ENTERO, TRUNCAR y RESIDUO descomponen números en parte entera, corte decimal exacto o resto de división; POTENCIA, RAIZ y ABS resuelven exponentes, raíces cuadradas y desviaciones sin signo.',
    keyTakeaways: [...mod19.keyTakeaways, ...mod110.keyTakeaways],
    functions: [...mod19.functions, ...mod110.functions],
    examples: [...mod19.examples, ...mod110.examples],
    exercises: CURATED_4_3_EXERCISES,
  },
  CURATED_4_3_EXERCISES
);

export const EXCEL_CURRICULUM: Record<string, ExcelLessonCurriculum> = {
  // Módulo 0 (0.0 – 0.7)
  'les-excel-0-0': normalizeLessonExercises('les-excel-0-0', EXCEL_CURRICULUM_MOD0['les-excel-0-0']),
  'les-excel-0-1': normalizeLessonExercises('les-excel-0-1', EXCEL_CURRICULUM_MOD0['les-excel-0-1']),
  'les-excel-0-2': normalizeLessonExercises('les-excel-0-2', EXCEL_CURRICULUM_MOD0['les-excel-0-2']),
  'les-excel-0-3': normalizeLessonExercises('les-excel-0-3', EXCEL_CURRICULUM_MOD0['les-excel-0-3']),
  'les-excel-0-4': normalizeLessonExercises('les-excel-0-4', EXCEL_CURRICULUM_MOD0['les-excel-0-4']),
  'les-excel-0-5': normalizeLessonExercises('les-excel-0-5', EXCEL_CURRICULUM_MOD0['les-excel-0-5']),
  'les-excel-0-6': normalizeLessonExercises('les-excel-0-6', EXCEL_CURRICULUM_MOD0['les-excel-0-6']),
  'les-excel-0-7': normalizeLessonExercises('les-excel-0-7', EXCEL_CURRICULUM_MOD0['les-excel-0-7']),

  // Módulo 1 (1.1 – 1.3)
  'les-excel-1-1': mergeFoundation('les-excel-1-1'),
  'les-excel-1-2': mergeFoundation('les-excel-1-2'),
  'les-excel-1-3': mergeFoundation('les-excel-1-3'),

  // Módulo 2 (2.1 – 2.3)
  'les-excel-2-1': mergeFoundation('les-excel-2-1'),
  'les-excel-2-2': mergeFoundation('les-excel-2-2'),
  'les-excel-2-3': mergeFoundation('les-excel-2-3'),

  // Módulo 3 (3.1 – 3.5)
  'les-excel-3-1': mergeFoundation('les-excel-3-1'),
  'les-excel-3-2': mergeFoundation('les-excel-3-2'),
  'les-excel-3-3': mergeFoundation('les-excel-3-3'),
  'les-excel-3-4': mergeFoundation('les-excel-3-4'),
  'les-excel-3-5': normalizeLessonExercises('les-excel-3-5', EXCEL_CURRICULUM_MOD0['les-excel-0-4']),

  // Módulo 4: Funciones Matemáticas, Estadísticas y Lógicas (4.1 – 4.12)
  'les-excel-4-1': normalizeLessonExercises('les-excel-4-1', EXCEL_CURRICULUM_MOD1A['les-excel-1-1']),
  'les-excel-4-2': normalizeLessonExercises('les-excel-4-2', EXCEL_CURRICULUM_MOD1B['les-excel-1-8']),
  'les-excel-4-3': EXCEL_CURRICULUM_4_3,
  'les-excel-4-4': normalizeLessonExercises('les-excel-4-4', EXCEL_CURRICULUM_MOD1A['les-excel-1-2']),
  'les-excel-4-5': normalizeLessonExercises('les-excel-4-5', EXCEL_CURRICULUM_MOD1A['les-excel-1-3']),
  'les-excel-4-6': normalizeLessonExercises('les-excel-4-6', EXCEL_CURRICULUM_MOD1A['les-excel-1-4']),
  'les-excel-4-7': normalizeLessonExercises('les-excel-4-7', EXCEL_CURRICULUM_MOD1A['les-excel-1-5']),
  'les-excel-4-8': normalizeLessonExercises('les-excel-4-8', EXCEL_CURRICULUM_MOD1A['les-excel-1-6']),
  'les-excel-4-9': normalizeLessonExercises('les-excel-4-9', EXCEL_CURRICULUM_MOD1B['les-excel-1-7']),
  'les-excel-4-10': normalizeLessonExercises('les-excel-4-10', EXCEL_CURRICULUM_MOD1B['les-excel-1-12']),
  'les-excel-4-11': normalizeLessonExercises('les-excel-4-11', EXCEL_CURRICULUM_MOD1B['les-excel-1-11']),
  'les-excel-4-12': normalizeLessonExercises('les-excel-4-12', EXCEL_CURRICULUM_MOD1B['les-excel-1-13']),
  'les-excel-4-13': normalizeLessonExercises('les-excel-4-13', EXCEL_CURRICULUM_MOD1B['les-excel-1-13']),
};
