import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

export const AuthGateNotice: React.FC = () => {
  const {
    t,
    signInWithGoogle,
    signInWithEmail,
    signInAsAdmin,
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
    <div className="mx-auto my-6 max-w-4xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
      {/* Dark Technological Left Info Panel */}
      <div className="lg:col-span-5 bg-[#070E1D] text-slate-100 p-6 sm:p-8 flex flex-col justify-between">
        <div>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#0052CC] text-white">
            <Lock className="w-5 h-5" />
          </span>
          <p className="mt-5 text-xs font-semibold text-cyan-300">DB Academy · Portal de acceso</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-white leading-tight text-balance">
            {t('signInRequiredTitle')}
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-slate-300">
            Accede a tu panel de estudiante con progreso en vivo, simuladores prácticos y certificados verificables.
          </p>
        </div>

        <ul className="mt-8 space-y-3 border-t border-slate-800 pt-6 text-xs text-slate-300">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>Progreso sincronizado entre escritorio y móvil</span>
          </li>
          <li className="flex items-start gap-2.5">
            <Award className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>Emisión automática de certificados en PDF</span>
          </li>
          <li className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Bóveda cifrada AES-GCM-256 en el navegador</span>
          </li>
        </ul>
      </div>

      {/* Right Sign-In Form */}
      <div className="lg:col-span-7 p-6 sm:p-8">
        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
          Iniciar sesión en DB Academy
        </h3>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
          Ingresa con tus credenciales o utiliza acceso rápido con Google.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-3.5">
          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-9 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0052CC] min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Contraseña
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="auth-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-9 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0052CC] font-mono min-h-[44px]"
              />
            </div>
          </div>

          {(authError || platformAuthError) && (
            <div className="p-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 text-xs text-red-700 dark:text-red-300 flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="block">{authError || platformAuthError}</span>
                  {(authError || platformAuthError || '').includes('Authorized domains') && (
                    <a
                      href="https://console.firebase.google.com/project/river-pipe-m6tvw/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block font-semibold underline hover:text-red-900 dark:hover:text-red-100"
                    >
                      Abrir Firebase Console → Authentication → Settings
                    </a>
                  )}
                </div>
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
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] disabled:opacity-60 px-4 py-2.5 text-xs font-semibold text-white transition-colors min-h-[44px]"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Accediendo...' : 'Iniciar Sesión con Credenciales'}</span>
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <span className="relative bg-white dark:bg-[#0F172A] px-3 text-[11px] text-slate-500 font-medium">
            O acceso rápido
          </span>
        </div>

        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors min-h-[42px]"
        >
          <LogIn className="w-4 h-4 text-[#0052CC] dark:text-cyan-400" />
          <span>Continuar con Google</span>
        </button>
      </div>
    </div>
  );
};
