import type { Course } from '../types';

/** Orden curricular fijo: Básico → Intermedio → Avanzado, sin importar el orden de creación. */
const LEVEL_ORDER: Record<Course['level'], number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

/** Desempate para la ruta de Excel cuando dos cursos comparten nivel. */
const EXCEL_SEQUENCE = [
  'excel-basico-05',
  'excel-intermedio-01',
  'excel-avanzado-01',
];

export function sortCoursesByLevel<T extends Course>(courses: readonly T[]): T[] {
  return [...courses].sort((a, b) => {
    const levelDiff = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
    if (levelDiff !== 0) return levelDiff;

    const aIndex = EXCEL_SEQUENCE.indexOf(a.id);
    const bIndex = EXCEL_SEQUENCE.indexOf(b.id);
    if (aIndex !== -1 || bIndex !== -1) {
      const normalizedA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
      const normalizedB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
      if (normalizedA !== normalizedB) return normalizedA - normalizedB;
    }
    return a.title.localeCompare(b.title, 'es');
  });
}
