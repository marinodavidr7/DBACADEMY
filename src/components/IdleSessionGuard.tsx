import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Clock3, LockKeyhole, LogOut } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import {
  clearSessionData,
  IDLE_TIMEOUT_MS,
  IDLE_WARNING_LEAD_MS,
  SESSION_EXPIRED_EVENT,
} from '../services/sessionService';

const ACTIVITY_EVENTS = [
  'pointerdown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'wheel',
] as const;

const formatCountdown = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Cierra la sesión tras 15 min de inactividad y avisa 60 s antes.
 * También reacciona a 401 de APIs propias (token expirado / sesión revocada).
 */
export const IdleSessionGuard: React.FC = () => {
  const { user, logout, setActiveView } = usePlatform();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(IDLE_WARNING_LEAD_MS / 1000));
  const lastActivityRef = useRef(Date.now());
  const warnedRef = useRef(false);
  const endingRef = useRef(false);

  const endSession = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    setShowWarning(false);
    clearSessionData();
    try {
      await logout();
    } catch {
      // Se continúa con el reinicio de la vista aunque falle signOut remoto.
    }
    setActiveView('landing');
    window.location.assign('/?session=expired');
  }, [logout, setActiveView]);

  useEffect(() => {
    if (!user) {
      warnedRef.current = false;
      endingRef.current = false;
      setShowWarning(false);
      return;
    }
    lastActivityRef.current = Date.now();

    let lastStamp = 0;
    const markActivity = () => {
      const now = Date.now();
      // Throttle: evita escribir en cada mousemove/scroll.
      if (now - lastStamp < 1500) return;
      lastStamp = now;
      lastActivityRef.current = now;
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, markActivity, { passive: true, capture: true })
    );

    const tick = () => {
      const remaining = IDLE_TIMEOUT_MS - (Date.now() - lastActivityRef.current);
      if (remaining <= 0) {
        void endSession();
        return;
      }
      if (remaining <= IDLE_WARNING_LEAD_MS) {
        warnedRef.current = true;
        setShowWarning(true);
        setSecondsLeft(Math.max(1, Math.ceil(remaining / 1000)));
      } else if (warnedRef.current) {
        warnedRef.current = false;
        setShowWarning(false);
      }
    };

    const onVisibility = () => {
      if (!document.hidden) tick();
    };
    const onSessionExpired = () => void endSession();
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    document.addEventListener('visibilitychange', onVisibility);
    const interval = window.setInterval(tick, 1000);
    tick();

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, markActivity, { capture: true })
      );
      window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
  }, [user, endSession]);

  if (!user || !showWarning) return null;

  const keepSession = () => {
    lastActivityRef.current = Date.now();
    warnedRef.current = false;
    setShowWarning(false);
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="idle-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <Clock3 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 id="idle-title" className="font-display text-lg font-bold text-[var(--dba-text-primary)]">
              Tu sesión está por finalizar
            </h2>
            <p className="mt-1 text-sm text-[var(--dba-text-secondary)]">
              Detectamos inactividad prolongada. Cerraremos la sesión para proteger tu cuenta en{' '}
              <strong className="font-mono text-[var(--dba-text-primary)]">{formatCountdown(secondsLeft)}</strong>.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-elevated)] p-3 text-xs text-[var(--dba-text-secondary)]">
          <LockKeyhole className="h-4 w-4 shrink-0" />
          Si no interactúas, se borrarán los datos de sesión y deberás iniciar sesión nuevamente.
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => void endSession()}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-[var(--dba-border)] px-4 py-2 text-sm font-medium text-[var(--dba-text-secondary)] hover:text-[var(--dba-text-primary)]"
          >
            <LogOut className="h-4 w-4" />
            Cerrar ahora
          </button>
          <button
            type="button"
            onClick={keepSession}
            className="inline-flex min-h-[42px] items-center justify-center rounded-lg bg-[var(--dba-accent)] px-4 py-2 text-sm font-semibold text-[var(--dba-accent-foreground)] hover:bg-[var(--dba-accent-hover)]"
          >
            Seguir conectado
          </button>
        </div>
      </div>
    </div>
  );
};
