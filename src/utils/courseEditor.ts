import type {
  CourseLesson,
  CourseModule,
  CourseQuizOption,
  CourseQuizQuestion,
} from '../types';

/* ------------------------------------------------------------------ */
/*  Identificadores y clones                                           */
/* ------------------------------------------------------------------ */

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function cloneModules(modules: CourseModule[]): CourseModule[] {
  return modules.map((module) => ({
    ...module,
    quizOptions: [...(module.quizOptions ?? [])],
    questions: (module.questions ?? []).map((question) => ({
      ...question,
      options: question.options.map((option) => ({ ...option })),
      correctIndexes: [...question.correctIndexes],
    })),
    lessons: (module.lessons ?? []).map((lesson) => ({
      ...lesson,
      materials: (lesson.materials ?? []).map((material) => ({ ...material })),
    })),
  }));
}

export function createEmptyLesson(index: number): CourseLesson {
  return {
    id: newId('les'),
    title: `Lección ${index}`,
    durationMinutes: 15,
    summary: '',
    content: '',
    materials: [],
    type: 'text',
    status: 'draft',
  };
}

export function createEmptyModule(index: number): CourseModule {
  const lesson = createEmptyLesson(1);
  return {
    id: newId('mod'),
    title: `Módulo ${index}`,
    durationMinutes: 15,
    quizQuestion: '',
    quizOptions: ['', '', ''],
    quizCorrectIndex: 0,
    quizEnabled: true,
    questions: [createEmptyQuestion()],
    lessons: [lesson],
  };
}

export function createEmptyQuestion(): CourseQuizQuestion {
  return {
    id: newId('q'),
    prompt: '',
    explanation: '',
    multiple: false,
    options: [createEmptyOption(), createEmptyOption()],
    correctIndexes: [],
  };
}

export function createEmptyOption(): CourseQuizOption {
  return { id: newId('opt'), text: '' };
}

/* ------------------------------------------------------------------ */
/*  Migración de evaluaciones antiguas                                 */
/* ------------------------------------------------------------------ */

/**
 * Convierte el formato heredado (una pregunta, 3 opciones) al formato de
 * evaluación ampliada sin perder datos. Los módulos que ya traen `questions`
 * se dejan intactos.
 */
export function migrateModuleQuiz(module: CourseModule): CourseModule {
  if (module.questions && module.questions.length > 0) {
    return module;
  }

  const options = (module.quizOptions ?? []).map((text, index) => ({
    id: newId('opt'),
    text,
    // El índice correcto del formato antiguo se conserva.
    ...(index === module.quizCorrectIndex ? {} : {}),
  }));

  const question: CourseQuizQuestion = {
    id: newId('q'),
    prompt: module.quizQuestion ?? '',
    explanation: '',
    multiple: false,
    options,
    correctIndexes:
      typeof module.quizCorrectIndex === 'number' &&
      module.quizCorrectIndex >= 0 &&
      module.quizCorrectIndex < options.length
        ? [module.quizCorrectIndex]
        : [],
  };

  return {
    ...module,
    quizEnabled: Boolean(module.quizEnabled ?? (module.quizQuestion ?? '').trim().length > 0),
    questions: [question],
  };
}

export function migrateModules(modules: CourseModule[]): CourseModule[] {
  return modules.map(migrateModuleQuiz);
}

/* ------------------------------------------------------------------ */
/*  Numeración automática                                              */
/* ------------------------------------------------------------------ */

export interface ModuleNumbering {
  moduleNumber: number;
  moduleLabel: string;
  lessons: Array<{ lesson: CourseLesson; label: string }>;
}

/** Numeración 1, 1.1, 1.2, 2, 2.1… basada en la posición, no en el título. */
export function buildNumbering(modules: CourseModule[]): ModuleNumbering[] {
  return modules.map((module, moduleIndex) => ({
    moduleNumber: moduleIndex + 1,
    moduleLabel: `${moduleIndex + 1}`,
    lessons: (module.lessons ?? []).map((lesson, lessonIndex) => ({
      lesson,
      label: `${moduleIndex + 1}.${lessonIndex + 1}`,
    })),
  }));
}

/** Elimina prefijos manuales tipo "01.", "1.2 ", "Módulo 1:" del título. */
export function stripManualPrefix(title: string): string {
  return title
    .replace(/^\s*(?:m[óo]dulo\s*)?\d+(?:[.\-]\d+)*\s*[.:\-–—]?\s*/i, '')
    .trim();
}

/* ------------------------------------------------------------------ */
/*  Validación                                                         */
/* ------------------------------------------------------------------ */

export interface QuestionValidation {
  promptError?: string;
  optionsError?: string;
  correctError?: string;
  optionErrors: Array<string | undefined>;
}

export function validateQuestion(question: CourseQuizQuestion): QuestionValidation {
  const optionErrors = question.options.map((option) =>
    option.text.trim().length === 0 ? 'empty-option' : undefined
  );

  const filledOptions = question.options.filter((option) => option.text.trim().length > 0);
  const correctCount = question.correctIndexes.filter((index) =>
    question.options[index]?.text.trim()
  ).length;

  return {
    promptError: question.prompt.trim().length === 0 ? 'empty-prompt' : undefined,
    optionsError:
      filledOptions.length < 2 ? 'min-options' : optionErrors.some(Boolean) ? 'empty-option' : undefined,
    correctError:
      correctCount === 0
        ? 'no-correct'
        : !question.multiple && correctCount > 1
          ? 'single-correct'
          : undefined,
    optionErrors,
  };
}

export function isQuestionValid(question: CourseQuizQuestion): boolean {
  const validation = validateQuestion(question);
  return Boolean(
    !validation.promptError &&
      !validation.optionsError &&
      !validation.correctError &&
      validation.optionErrors.every((error) => !error)
  );
}

export interface ModuleValidation {
  titleError?: string;
  lessonsError?: string;
  quizError?: string;
  questionErrors: QuestionValidation[];
}

export function validateModule(module: CourseModule): ModuleValidation {
  const questionErrors = (module.questions ?? []).map(validateQuestion);
  const hasInvalidQuestion = questionErrors.some(
    (error) =>
      error.promptError || error.optionsError || error.correctError || error.optionErrors.some(Boolean)
  );

  return {
    titleError: module.title.trim().length === 0 ? 'empty-title' : undefined,
    lessonsError: (module.lessons ?? []).length === 0 ? 'no-lessons' : undefined,
    quizError:
      module.quizEnabled === false
        ? undefined
        : hasInvalidQuestion
          ? 'invalid-question'
          : (module.questions ?? []).length === 0
            ? 'no-questions'
            : undefined,
    questionErrors,
  };
}

export interface PublishCheckItem {
  moduleId: string;
  moduleLabel: string;
  lessonId?: string;
  lessonLabel?: string;
  reason: 'lesson-empty' | 'module-no-quiz' | 'quiz-invalid';
}

export function collectPublishIssues(modules: CourseModule[]): PublishCheckItem[] {
  const issues: PublishCheckItem[] = [];

  modules.forEach((module, moduleIndex) => {
    (module.lessons ?? []).forEach((lesson, lessonIndex) => {
      if (!lesson.content.trim() && lesson.type !== 'video') {
        issues.push({
          moduleId: module.id,
          moduleLabel: `${moduleIndex + 1}`,
          lessonId: lesson.id,
          lessonLabel: `${moduleIndex + 1}.${lessonIndex + 1}`,
          reason: 'lesson-empty',
        });
      }
    });

    const validation = validateModule(module);
    if (module.quizEnabled !== false && validation.quizError) {
      issues.push({
        moduleId: module.id,
        moduleLabel: `${moduleIndex + 1}`,
        reason: validation.quizError === 'no-questions' ? 'module-no-quiz' : 'quiz-invalid',
      });
    }
  });

  return issues;
}

/* ------------------------------------------------------------------ */
/*  Reordenamiento                                                     */
/* ------------------------------------------------------------------ */

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function reorderModules(
  modules: CourseModule[],
  from: number,
  to: number
): CourseModule[] {
  return moveItem(modules, from, to);
}

export function reorderLessons(
  modules: CourseModule[],
  moduleId: string,
  from: number,
  to: number
): CourseModule[] {
  return modules.map((module) =>
    module.id === moduleId ? { ...module, lessons: moveItem(module.lessons ?? [], from, to) } : module
  );
}

/** Mueve una lección de un módulo a otro (o a otra posición dentro del mismo). */
export function moveLessonBetweenModules(
  modules: CourseModule[],
  sourceModuleId: string,
  sourceIndex: number,
  targetModuleId: string,
  targetIndex: number
): CourseModule[] {
  const source = modules.find((module) => module.id === sourceModuleId);
  if (!source) return modules;
  const lesson = (source.lessons ?? [])[sourceIndex];
  if (!lesson) return modules;

  return modules.map((module) => {
    if (module.id === sourceModuleId && module.id === targetModuleId) {
      return { ...module, lessons: moveItem(module.lessons ?? [], sourceIndex, targetIndex) };
    }
    if (module.id === sourceModuleId) {
      return {
        ...module,
        lessons: (module.lessons ?? []).filter((_, index) => index !== sourceIndex),
      };
    }
    if (module.id === targetModuleId) {
      const lessons = [...(module.lessons ?? [])];
      const insertAt = Math.max(0, Math.min(targetIndex, lessons.length));
      lessons.splice(insertAt, 0, lesson);
      return { ...module, lessons };
    }
    return module;
  });
}

/* ------------------------------------------------------------------ */
/*  YouTube                                                            */
/* ------------------------------------------------------------------ */

export function extractYouTubeId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([A-Za-z0-9_-]{6,15})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{6,15})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{6,15})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{6,15})/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/* ------------------------------------------------------------------ */
/*  Archivos                                                           */
/* ------------------------------------------------------------------ */

export const MAX_MATERIAL_BYTES = 100 * 1024 * 1024;

export const MATERIAL_ACCEPT = [
  'application/pdf',
  'video/*',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'image/*',
  'application/zip',
  'application/x-zip-compressed',
].join(',');

export function validateMaterialFile(file: File): string | null {
  if (file.size > MAX_MATERIAL_BYTES) return 'too-large';
  if (file.type && MATERIAL_ACCEPT.split(',').some((accept) => accept.endsWith('/*') ? file.type.startsWith(accept.slice(0, -1)) : accept === file.type)) {
    return null;
  }
  if (!file.type) return null;
  return 'unsupported-type';
}
