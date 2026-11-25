/**
 * Calendario cívico y temas estacionales — DB Academy (República Dominicana).
 * resolveSeasonalTheme() es pura para poder probarla con fechas simuladas (QA).
 */

export type SeasonalThemeId =
  | 'default'
  | 'navidad'
  | 'altagracia'
  | 'duarte'
  | 'mella'
  | 'independencia'
  | 'sanchez'
  | 'san-jose-azua'
  | 'restauracion'
  | 'mercedes'
  | 'constitucion';

export interface HolidayTheme {
  id: SeasonalThemeId;
  label: string;
  month: number; // 1-12
  day: number;
  themeClass: string;
  accent: string;
  greeting: string;
}

export interface SeasonalTheme {
  id: SeasonalThemeId;
  label: string;
  themeClass: string | null;
  accent: string | null;
  greeting: string | null;
  isChristmas: boolean;
  /** Meses completos con tema activo (actualmente diciembre). */
  isFullMonth: boolean;
  /** true cuando un administrador está forzando el tema para previsualizar. */
  isPreview?: boolean;
}

export const HOLIDAY_THEMES: readonly HolidayTheme[] = [
  {
    id: 'altagracia', label: 'Día de Nuestra Señora de la Altagracia',
    month: 1, day: 21, themeClass: 'theme-altagracia', accent: '#7C3AED',
    greeting: '🕊️ Hoy conmemoramos el Día de Nuestra Señora de la Altagracia.',
  },
  {
    id: 'duarte', label: 'Natalicio de Juan Pablo Duarte',
    month: 1, day: 26, themeClass: 'theme-duarte', accent: '#1D4ED8',
    greeting: '🇩🇴 Recordando el natalicio del Padre de la Patria, Juan Pablo Duarte.',
  },
  {
    id: 'mella', label: 'Natalicio de Ramón Matías Mella',
    month: 2, day: 25, themeClass: 'theme-mella', accent: '#B91C1C',
    greeting: '🇩🇴 Hoy honramos el natalicio de Ramón Matías Mella.',
  },
  {
    id: 'independencia', label: 'Día de la Independencia Nacional',
    month: 2, day: 27, themeClass: 'theme-independencia', accent: '#1D4ED8',
    greeting: '🇩🇴 ¡Feliz Día de la Independencia Nacional!',
  },
  {
    id: 'sanchez', label: 'Natalicio de Francisco del Rosario Sánchez',
    month: 3, day: 9, themeClass: 'theme-sanchez', accent: '#0F766E',
    greeting: '🇩🇴 Conmemorando el natalicio de Francisco del Rosario Sánchez.',
  },
  {
    id: 'san-jose-azua', label: 'Fiesta de San José y Batalla de Azua',
    month: 3, day: 19, themeClass: 'theme-san-jose-azua', accent: '#15803D',
    greeting: '🇩🇴 Hoy conmemoramos la Batalla de Azua y la Fiesta de San José.',
  },
  {
    id: 'restauracion', label: 'Día de la Restauración',
    month: 8, day: 16, themeClass: 'theme-restauracion', accent: '#B91C1C',
    greeting: '🇩🇴 ¡Feliz Día de la Restauración!',
  },
  {
    id: 'mercedes', label: 'Día de Nuestra Señora de las Mercedes',
    month: 9, day: 24, themeClass: 'theme-mercedes', accent: '#7C3AED',
    greeting: '🕊️ Hoy celebramos a Nuestra Señora de las Mercedes, Patrona de la República.',
  },
  {
    id: 'constitucion', label: 'Día de la Constitución',
    month: 11, day: 6, themeClass: 'theme-constitucion', accent: '#1E40AF',
    greeting: '📜 Hoy conmemoramos el Día de la Constitución Dominicana.',
  },
];

export const CHRISTMAS_THEME: SeasonalTheme = {
  id: 'navidad',
  label: 'Temporada Navideña',
  themeClass: 'theme-navidad',
  accent: '#B91C1C',
  greeting: '🎄 ¡Temporada Navideña en DB Academy! Impulsa tu futuro profesional con becas y beneficios especiales.',
  isChristmas: true,
  isFullMonth: true,
};

export const DEFAULT_THEME: SeasonalTheme = {
  id: 'default',
  label: 'Tema estándar',
  themeClass: null,
  accent: null,
  greeting: null,
  isChristmas: false,
  isFullMonth: false,
};

/** Resuelve el tema vigente para una fecha dada (hora local del navegador). */
export function resolveSeasonalTheme(date: Date): SeasonalTheme {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (month === 12) return CHRISTMAS_THEME;

  const holiday = HOLIDAY_THEMES.find((item) => item.month === month && item.day === day);
  if (!holiday) return DEFAULT_THEME;

  return {
    id: holiday.id,
    label: holiday.label,
    themeClass: holiday.themeClass,
    accent: holiday.accent,
    greeting: holiday.greeting,
    isChristmas: false,
    isFullMonth: false,
  };
}

/** Devuelve el tema configurable por id (para overrides de administrador). */
export function getThemeById(id: SeasonalThemeId): SeasonalTheme | null {
  if (id === 'default') return DEFAULT_THEME;
  if (id === 'navidad') return CHRISTMAS_THEME;
  const holiday = HOLIDAY_THEMES.find((item) => item.id === id);
  if (!holiday) return null;
  return {
    id: holiday.id,
    label: holiday.label,
    themeClass: holiday.themeClass,
    accent: holiday.accent,
    greeting: holiday.greeting,
    isChristmas: false,
    isFullMonth: false,
  };
}

export const SELECTABLE_THEME_IDS: SeasonalThemeId[] = [
  'navidad',
  ...HOLIDAY_THEMES.map((item) => item.id),
];

/** Valida un id de theme proveniente de URL/sessionStorage (puramente, para tests). */
export function parseThemeId(value: string | null | undefined): SeasonalThemeId | null {
  if (!value) return null;
  return SELECTABLE_THEME_IDS.includes(value as SeasonalThemeId)
    ? (value as SeasonalThemeId)
    : null;
}

/** Clases que el proveedor aplica/retira del <html>. */
export const SEASONAL_THEME_CLASSES = [
  CHRISTMAS_THEME.themeClass!,
  ...HOLIDAY_THEMES.map((item) => item.themeClass),
];
