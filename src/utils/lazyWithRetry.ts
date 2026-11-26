import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const RELOAD_GUARD_KEY = 'dba_chunk_reload_at';

export function isDynamicImportError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /dynamically imported module|failed to fetch|importing a module script|loading chunk|loading css chunk|outdated optimize dep/i.test(
    msg
  );
}

/**
 * Wraps React.lazy with automatic retry + single safe reload when a dynamic
 * chunk fails due to a deployment update or dev-server restart.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await importer();
    } catch (firstErr) {
      if (!isDynamicImportError(firstErr)) throw firstErr;
      await new Promise((resolve) => setTimeout(resolve, 350));
      try {
        return await importer();
      } catch (secondErr) {
        if (typeof window !== 'undefined' && isDynamicImportError(secondErr)) {
          try {
            const lastReload = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || '0');
            if (Date.now() - lastReload > 15_000) {
              sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
              window.location.reload();
              return new Promise<{ default: T }>(() => {});
            }
          } catch {
            // sessionStorage unavailable
          }
        }
        throw secondErr;
      }
    }
  });
}
