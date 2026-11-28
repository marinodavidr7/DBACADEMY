type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: string, params: AnalyticsParams = {}): void {
  if (typeof window === 'undefined') return;
  const payload = {
    ...params,
    app: 'dbacademy',
    ts: new Date().toISOString(),
  };

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', event, payload);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event, ...payload });
    }
  } catch {
    // no-op
  }

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[analytics]', event, payload);
  }
}
