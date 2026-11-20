import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      let hadDevSw = false;
      for (const reg of registrations) {
        if (reg.active?.scriptURL.includes('dev-sw.js') || reg.installing?.scriptURL.includes('dev-sw.js')) {
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
}

createRoot(document.getElementById('root')!).render(<App />);
