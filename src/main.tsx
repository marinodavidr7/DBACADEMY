import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import { installUnauthorizedInterceptor } from './services/sessionService';
import './index.css';

// Recuperación ante chunks obsoletos tras un despliegue (Vite preload error).
// Si el hash del chunk ya no existe en el CDN, recargamos una vez para obtener el nuevo index.html.
const reloadOnStaleChunk = (shouldPreventDefault?: () => void) => {
  const key = 'chunk-reload-at';
  const last = Number(sessionStorage.getItem(key) || 0);
  if (Date.now() - last < 60_000) return; // Evitar bucles de recarga
  sessionStorage.setItem(key, String(Date.now()));
  shouldPreventDefault?.();
  window.location.reload();
};

window.addEventListener('vite:preloadError', (event) => {
  reloadOnStaleChunk(() => event.preventDefault());
});

window.addEventListener('unhandledrejection', (event) => {
  const message = String((event.reason as { message?: unknown })?.message ?? event.reason ?? '');
  if (/dynamically imported module|Loading chunk|ChunkLoadError/i.test(message)) {
    reloadOnStaleChunk(() => event.preventDefault());
  }
});

// Los 401 de /api/* propios cierran la sesión de forma centralizada.
installUnauthorizedInterceptor();

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      let hadDevSw = false;
      for (const reg of registrations) {
        if (
          reg.active?.scriptURL.includes('dev-sw.js') ||
          reg.installing?.scriptURL.includes('dev-sw.js')
        ) {
          hadDevSw = true;
        }
        void reg.unregister();
      }
      if ('caches' in window) {
        void caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
      }
      if (hadDevSw) {
        window.location.reload();
      }
    })
    .catch(() => {
      // Ignore SW cleanup errors in restricted frames
    });
} else if (!import.meta.env.DEV && 'serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      void updateSW(true);
    },
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        window.setInterval(() => {
          void registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError() {
      // Ignore SW registration errors in restricted frames
    },
  });
}

createRoot(document.getElementById('root')!).render(<App />);
