import React from 'react';
import { Lock, LogIn } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

export const AuthGateNotice: React.FC = () => {
  const { t, signInWithGoogle } = usePlatform();

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 max-w-xl mx-auto my-8">
      <div className="w-11 h-11 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
        <Lock className="w-5 h-5" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
        {t('signInRequiredTitle')}
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        {t('signInRequiredDesc')}
      </p>
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors min-h-[44px]"
      >
        <LogIn className="w-4 h-4" />
        <span>{t('signInGoogle')}</span>
      </button>
    </div>
  );
};
