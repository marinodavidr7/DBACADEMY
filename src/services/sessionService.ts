/**
 * Control de sesión por inactividad — DB Academy.
 * Frontend: temporizador global + interceptor de 401 para APIs propias.
 * El backend mantiene además una marca de actividad por sesión (server.ts).
 */

/** 15 minutos sin interacción: se cierra la sesión (QA ticket sesiones inactivas). */
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
/** Aviso con 60 segundos de anticipación. */
export const IDLE_WARNING_LEAD_MS = 60 * 1000;

export const SESSION_EXPIRED_EVENT = 'dba_session_expired';

/** Limpia sólo datos de sesión; conserva preferencias y evidencia legal. */
export function clearSessionData(): void {
  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith('dba_'))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // almacenamiento no disponible
  }
}

/**
 * Convierte cualquier 401 de /api/* propio en un evento global para que el
 * guard de sesión cierre la sesión y limpie el estado de la aplicación.
 * Se instala una sola vez en main.tsx.
 */
export function installUnauthorizedInterceptor(): void {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;

  const win = window as Window & { __dbaFetchInterceptorInstalled?: boolean };
  if (win.__dbaFetchInterceptorInstalled) return;

  const nativeFetch = window.fetch.bind(window);
  const wrappedFetch: typeof window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const response = await nativeFetch(input, init);
    if (response.status === 401) {
      const rawUrl =
        typeof input === 'string'
          ? input
          : input instanceof Request
            ? input.url
            : String(input);
      try {
        const parsed = new URL(rawUrl, window.location.href);
        if (parsed.origin === window.location.origin && parsed.pathname.startsWith('/api/')) {
          window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
        }
      } catch {
        // URL no analizable: no se cierra la sesión por un 401 externo.
      }
    }
    return response;
  };

  try {
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (desc && (desc.writable || desc.set)) {
      window.fetch = wrappedFetch;
      win.__dbaFetchInterceptorInstalled = true;
    } else if (!desc || desc.configurable) {
      Object.defineProperty(window, 'fetch', {
        value: wrappedFetch,
        writable: true,
        configurable: true,
      });
      win.__dbaFetchInterceptorInstalled = true;
    }
  } catch {
    // Entornos con window.fetch de sólo lectura (p. ej. iframe/proxy estricto): no bloquear el arranque.
  }
}
