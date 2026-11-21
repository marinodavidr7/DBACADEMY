import React, { useState } from 'react';
import { AlertCircle, KeyRound, Lock, LogIn, Mail, ShieldCheck, User } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

export const AuthGateNotice: React.FC = () => {
  const {
    t,
    signInWithGoogle,
    signInWithEmail,
    signInAsAdmin,
    signInAsDemo,
    authError: platformAuthError,
    clearAuthError,
  } = usePlatform();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      const res = await signInWithEmail(email, password);
      if (!res.success) {
        setAuthError(res.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 max-w-xl mx-auto my-8 shadow-xs">
      <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
        <Lock className="w-6 h-6" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">
        {t('signInRequiredTitle')}
      </h2>
      <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        Ingresa con tu cuenta o utiliza el acceso con Google.
      </p>

      {/* Formulario de inicio de sesión */}
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-9 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Contraseña
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-9 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
            />
          </div>
        </div>

        {(authError || platformAuthError) && (
          <div className="p-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 text-xs text-red-600 dark:text-red-400 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError || platformAuthError}</span>
            </div>
            {platformAuthError && !authError && (
              <button
                type="button"
                onClick={clearAuthError}
                className="text-[11px] font-semibold underline shrink-0"
              >
                Cerrar
              </button>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors min-h-[42px]"
        >
          <LogIn className="w-4 h-4" />
          <span>{loading ? 'Accediendo...' : 'Iniciar Sesión con Credenciales'}</span>
        </button>
      </form>

      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <span className="relative bg-white dark:bg-[#111827] px-3 text-[11px] text-slate-400 uppercase font-medium">
          o acceso rápido
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => void signInAsAdmin()}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-semibold text-white shadow-xs transition-colors min-h-[40px]"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
          <span>Admin Directo</span>
        </button>

        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors min-h-[40px]"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => void signInAsDemo()}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors min-h-[40px]"
        >
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span>Modo Demo</span>
        </button>
      </div>
    </div>
  );
};
