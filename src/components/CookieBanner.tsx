import React, { useEffect, useState } from 'react';
import { legalConsentService } from '../services/legalConsentService';

const CONSENT_DECIDED_KEY = 'dba_cookie_consent_v1';

export const CookieBanner: React.FC<{ onOpenLegal?: () => void }> = ({ onOpenLegal }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!legalConsentService.hasCookieDecision());

    const handleUpdated = () => {
      if (legalConsentService.hasCookieDecision()) setVisible(false);
    };
    window.addEventListener('dba_cookie_preferences_updated', handleUpdated);
    return () => window.removeEventListener('dba_cookie_preferences_updated', handleUpdated);
  }, []);

  const save = (mode: 'necessary' | 'all') => {
    const prefs = legalConsentService.saveCookiePreferences({
      functionalPersonalization: mode === 'all',
      performanceAnalytics: mode === 'all',
      marketingCookies: mode === 'all',
    });

    try {
      localStorage.setItem(
        CONSENT_DECIDED_KEY,
        JSON.stringify({
          value: mode,
          date: prefs.updatedAt,
          version: prefs.version,
        })
      );
      legalConsentService.recordConsent({
        docType: 'cookies',
        marketingOptIn: mode === 'all',
      });
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] p-3 sm:p-4 safe-pb">
      <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-lg p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
          Usamos almacenamiento local y cookies estrictamente necesarias para operar DB Academy (Ley 172-13). Puedes aceptar todas, limitar a las necesarias o{' '}
          <button
            type="button"
            onClick={onOpenLegal}
            className="underline font-medium hover:text-blue-600 dark:hover:text-blue-400"
          >
            configurar tus preferencias y leer la Política de Cookies
          </button>
          .
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => save('necessary')}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px]"
          >
            Solo necesarias
          </button>
          <button
            type="button"
            onClick={() => save('all')}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white min-h-[40px]"
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
};
