import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getThemeById,
  parseThemeId,
  resolveSeasonalTheme,
  SEASONAL_THEME_CLASSES,
  type SeasonalTheme,
  type SeasonalThemeId,
} from '../config/holidays.config';
import { usePlatform } from '../context/PlatformContext';

export type ThemePreviewId = 'auto' | SeasonalThemeId;

interface SeasonalThemeContextValue {
  theme: SeasonalTheme;
  previewId: ThemePreviewId;
  setPreviewId: (id: ThemePreviewId) => void;
  resetPreview: () => void;
}

const PREVIEW_STORAGE_KEY = 'admin_preview_theme';
const PREVIEW_EVENT = 'dba_admin_preview_theme';

const SeasonalThemeContext = createContext<SeasonalThemeContextValue>({
  theme: resolveSeasonalTheme(new Date()),
  previewId: 'auto',
  setPreviewId: () => undefined,
  resetPreview: () => undefined,
});

/** Tema vigente (auto por fecha o forzado por el administrador). */
export const useSeasonalTheme = (): SeasonalTheme => useContext(SeasonalThemeContext).theme;

/** Controles de previsualización (sólo administradores). */
export const useSeasonalThemePreview = (): SeasonalThemeContextValue =>
  useContext(SeasonalThemeContext);

const readUrlTheme = (): ThemePreviewId => {
  if (typeof window === 'undefined') return 'auto';
  return parseThemeId(new URLSearchParams(window.location.search).get('theme')) ?? 'auto';
};

const readStoredTheme = (): ThemePreviewId => {
  try {
    return parseThemeId(sessionStorage.getItem(PREVIEW_STORAGE_KEY)) ?? 'auto';
  } catch {
    return 'auto';
  }
};

const writeUrlTheme = (id: ThemePreviewId): void => {
  const url = new URL(window.location.href);
  if (id === 'auto') url.searchParams.delete('theme');
  else url.searchParams.set('theme', id);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
};

interface ProviderProps {
  children: React.ReactNode;
}

export const SeasonalThemeProvider: React.FC<ProviderProps> = ({ children }) => {
  const { user, isAdmin } = usePlatform();
  const [baseTheme, setBaseTheme] = useState<SeasonalTheme>(() => resolveSeasonalTheme(new Date()));
  const [previewId, setPreviewIdState] = useState<ThemePreviewId>('auto');

  // Reevalúa a medianoche local y al cambiar de día (cambios a las 00:00).
  useEffect(() => {
    let timer: number | undefined;
    const refresh = () => setBaseTheme(resolveSeasonalTheme(new Date()));
    const schedule = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
      timer = window.setTimeout(
        () => {
          refresh();
          schedule();
        },
        Math.max(1000, nextMidnight.getTime() - now.getTime())
      );
    };
    refresh();
    schedule();
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  // El override sólo existe mientras haya una sesión de administrador activa.
  useEffect(() => {
    if (!user || !isAdmin) {
      setPreviewIdState('auto');
      try {
        sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
      } catch {
        // almacenamiento no disponible
      }
      if (readUrlTheme() !== 'auto') writeUrlTheme('auto');
      return;
    }
    const sync = () => {
      const fromUrl = readUrlTheme();
      const stored = readStoredTheme();
      setPreviewIdState(fromUrl !== 'auto' ? fromUrl : stored);
    };
    sync();
    window.addEventListener('popstate', sync);
    window.addEventListener(PREVIEW_EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(PREVIEW_EVENT, sync);
    };
  }, [user, isAdmin]);

  const setPreviewId = useCallback(
    (id: ThemePreviewId) => {
      if (!user || !isAdmin) return;
      try {
        if (id === 'auto') sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
        else sessionStorage.setItem(PREVIEW_STORAGE_KEY, id);
      } catch {
        // almacenamiento no disponible
      }
      writeUrlTheme(id);
      setPreviewIdState(id);
      window.dispatchEvent(new Event(PREVIEW_EVENT));
    },
    [user, isAdmin]
  );

  const resetPreview = useCallback(() => setPreviewId('auto'), [setPreviewId]);

  const theme = useMemo<SeasonalTheme>(() => {
    if (previewId === 'auto') return { ...baseTheme, isPreview: false };
    const forced = getThemeById(previewId);
    return forced ? { ...forced, isPreview: true } : { ...baseTheme, isPreview: false };
  }, [baseTheme, previewId]);

  // Aplica la clase del tema al <html> y el favicon navideño (también en preview).
  useEffect(() => {
    const root = document.documentElement;
    SEASONAL_THEME_CLASSES.forEach((className) => root.classList.remove(className));
    if (theme.themeClass) root.classList.add(theme.themeClass);
    root.setAttribute('data-seasonal-theme', theme.id);
    if (theme.isPreview) root.setAttribute('data-seasonal-preview', 'true');
    else root.removeAttribute('data-seasonal-preview');

    const icons = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'));
    icons.forEach((link) => {
      if (!link.dataset.seasonalOriginal) link.dataset.seasonalOriginal = link.href;
      link.href = theme.isChristmas ? '/logos/navidad/pwa-192.png' : link.dataset.seasonalOriginal;
    });

    return () => {
      SEASONAL_THEME_CLASSES.forEach((className) => root.classList.remove(className));
      root.removeAttribute('data-seasonal-theme');
      root.removeAttribute('data-seasonal-preview');
      icons.forEach((link) => {
        if (link.dataset.seasonalOriginal) link.href = link.dataset.seasonalOriginal;
      });
    };
  }, [theme]);

  const value = useMemo<SeasonalThemeContextValue>(
    () => ({ theme, previewId, setPreviewId, resetPreview }),
    [theme, previewId, setPreviewId, resetPreview]
  );

  return <SeasonalThemeContext.Provider value={value}>{children}</SeasonalThemeContext.Provider>;
};
