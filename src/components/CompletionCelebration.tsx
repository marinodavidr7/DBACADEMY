import React, { useEffect, useMemo } from 'react';
import { Award, CheckCircle2, Eye, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { Certificate } from '../types';

export type CelebrationKind = 'lesson' | 'module' | 'course';

export interface CelebrationEvent {
  id: number;
  kind: CelebrationKind;
  title: string;
  subtitle?: string;
  certificate?: Certificate | null;
}

interface CompletionCelebrationProps {
  event: CelebrationEvent | null;
  onDismiss: () => void;
  onViewCertificate?: (cert: Certificate) => void;
}

interface ConfettiPaletteItem {
  bgClass: string;
  textClass: string;
}

interface ConfettiParticle {
  id: number;
  xStartVw: number;
  xDriftPx: number;
  yStartVh: number;
  yEndVh: number;
  rotateStart: number;
  rotateEnd: number;
  scale: number;
  delay: number;
  duration: number;
  palette: ConfettiPaletteItem;
  shape: 'ribbon' | 'dot' | 'diamond' | 'sparkle';
}

interface SparkleBurst {
  id: number;
  angleDeg: number;
  distancePx: number;
  sizePx: number;
  delay: number;
  textClass: string;
}

const CONFETTI_PALETTE: ConfettiPaletteItem[] = [
  { bgClass: 'bg-emerald-500', textClass: 'text-emerald-500' },
  { bgClass: 'bg-blue-600', textClass: 'text-blue-600' },
  { bgClass: 'bg-amber-500', textClass: 'text-amber-500' },
  { bgClass: 'bg-[#107C41]', textClass: 'text-[#107C41]' },
  { bgClass: 'bg-cyan-500', textClass: 'text-cyan-500' },
  { bgClass: 'bg-violet-500', textClass: 'text-violet-500' },
];

function seededUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function generateParticles(seedBase: number, count: number, kind: CelebrationKind): ConfettiParticle[] {
  const shapes: ConfettiParticle['shape'][] = ['ribbon', 'dot', 'diamond', 'sparkle'];
  const isCourse = kind === 'course';
  const isModule = kind === 'module';

  return Array.from({ length: count }, (_, idx) => {
    const r1 = seededUnit(seedBase + idx * 3.17);
    const r2 = seededUnit(seedBase + idx * 7.31);
    const r3 = seededUnit(seedBase + idx * 11.43);
    const r4 = seededUnit(seedBase + idx * 17.59);

    return {
      id: idx,
      xStartVw: isCourse ? 6 + r1 * 88 : 24 + r1 * 52,
      xDriftPx: (r2 - 0.5) * (isCourse ? 240 : isModule ? 180 : 130),
      yStartVh: isCourse ? -8 - r3 * 12 : 12 + r3 * 18,
      yEndVh: isCourse ? 96 + r4 * 18 : 58 + r4 * 26,
      rotateStart: r1 * 360,
      rotateEnd: r1 * 360 + (r2 > 0.5 ? 1 : -1) * (240 + r3 * 360),
      scale: (isCourse ? 0.85 : 0.72) + r4 * 0.55,
      delay: r2 * (isCourse ? 0.55 : 0.25),
      duration: (isCourse ? 2.1 : isModule ? 1.75 : 1.45) + r3 * 0.8,
      palette: CONFETTI_PALETTE[idx % CONFETTI_PALETTE.length],
      shape: shapes[idx % shapes.length],
    };
  });
}

function generateSparkleRays(seedBase: number, count: number): SparkleBurst[] {
  return Array.from({ length: count }, (_, idx) => {
    const r1 = seededUnit(seedBase + idx * 5.23);
    const r2 = seededUnit(seedBase + idx * 9.71);
    return {
      id: idx,
      angleDeg: (360 / count) * idx + (r1 - 0.5) * 18,
      distancePx: 64 + r2 * 96,
      sizePx: 10 + Math.round(r1 * 10),
      delay: r2 * 0.14,
      textClass: CONFETTI_PALETTE[(idx + 2) % CONFETTI_PALETTE.length].textClass,
    };
  });
}

const SparkleStarSvg: React.FC<{ size: number; className: string }> = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 1L14.6 9.4L23 12L14.6 14.6L12 23L9.4 14.6L1 12L9.4 9.4L12 1Z" />
  </svg>
);

export const CompletionCelebration: React.FC<CompletionCelebrationProps> = ({
  event,
  onDismiss,
  onViewCertificate,
}) => {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!event) return;
    const timeoutMs = event.kind === 'course' ? 5400 : event.kind === 'module' ? 3400 : 2600;
    const timer = window.setTimeout(() => {
      onDismiss();
    }, timeoutMs);
    return () => window.clearTimeout(timer);
  }, [event, onDismiss]);

  useEffect(() => {
    if (!event) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [event, onDismiss]);

  const particles = useMemo(() => {
    if (!event || prefersReducedMotion) return [];
    const count = event.kind === 'course' ? 56 : event.kind === 'module' ? 34 : 22;
    return generateParticles(event.id % 997, count, event.kind);
  }, [event, prefersReducedMotion]);

  const sparkleRays = useMemo(() => {
    if (!event || prefersReducedMotion) return [];
    const count = event.kind === 'course' ? 16 : event.kind === 'module' ? 12 : 8;
    return generateSparkleRays((event.id % 997) + 41, count);
  }, [event, prefersReducedMotion]);

  const meta = useMemo(() => {
    if (!event) return null;
    if (event.kind === 'course') {
      return {
        eyebrow: '¡Curso completado al 100%!',
        accentGradient: 'from-amber-400 via-emerald-500 to-blue-600',
        ringColor: 'border-amber-400/60',
        iconBg: 'bg-amber-500 text-white',
        badgeBg: 'border-amber-300/80 dark:border-amber-700/80 bg-white/95 dark:bg-[#0F172A]/95',
        icon: <Award className="w-5 h-5" />,
      };
    }
    if (event.kind === 'module') {
      return {
        eyebrow: '¡Módulo completado!',
        accentGradient: 'from-emerald-400 via-teal-500 to-blue-500',
        ringColor: 'border-emerald-400/60',
        iconBg: 'bg-emerald-600 text-white',
        badgeBg: 'border-emerald-300/80 dark:border-emerald-700/80 bg-white/95 dark:bg-[#0F172A]/95',
        icon: <Sparkles className="w-5 h-5" />,
      };
    }
    return {
      eyebrow: '¡Capítulo completado!',
      accentGradient: 'from-blue-500 via-emerald-500 to-cyan-400',
      ringColor: 'border-blue-400/50',
      iconBg: 'bg-emerald-600 text-white',
      badgeBg: 'border-emerald-200 dark:border-emerald-800 bg-white/95 dark:bg-[#0F172A]/95',
      icon: <CheckCircle2 className="w-5 h-5" />,
    };
  }, [event]);

  return (
    <AnimatePresence>
      {event && meta && (
        <div
          key={event.id}
          className="fixed inset-0 z-[75] pointer-events-none overflow-hidden flex items-start justify-center pt-16 sm:pt-20 px-4"
          aria-live="polite"
        >
          {/* Radial Sparkle Flash ("Destello") behind the achievement banner */}
          {!prefersReducedMotion && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.25, opacity: 0.85 }}
                animate={{ scale: event.kind === 'course' ? 3.2 : 2.1, opacity: 0 }}
                transition={{ duration: event.kind === 'course' ? 1.05 : 0.75, ease: 'easeOut' }}
                className={`w-40 h-40 rounded-full bg-gradient-to-tr ${meta.accentGradient} blur-2xl`}
              />
              <motion.div
                initial={{ scale: 0.3, opacity: 0.9 }}
                animate={{ scale: event.kind === 'course' ? 2.6 : 1.85, opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className={`absolute w-32 h-32 rounded-full border-2 ${meta.ringColor}`}
              />

              {/* Starburst Sparkle Rays */}
              {sparkleRays.map((ray) => {
                const rad = (ray.angleDeg * Math.PI) / 180;
                const tx = Math.cos(rad) * ray.distancePx;
                const ty = Math.sin(rad) * ray.distancePx;
                return (
                  <motion.div
                    key={ray.id}
                    initial={{ x: 0, y: 0, scale: 0.2, opacity: 1, rotate: 0 }}
                    animate={{
                      x: tx,
                      y: ty,
                      scale: [0.3, 1.25, 0],
                      opacity: [0, 1, 0],
                      rotate: 90,
                    }}
                    transition={{
                      duration: 0.9,
                      delay: ray.delay,
                      ease: 'easeOut',
                    }}
                    className="absolute"
                  >
                    <SparkleStarSvg size={ray.sizePx} className={ray.textClass} />
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Falling / Bursting Confetti Shower */}
          {!prefersReducedMotion &&
            particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{
                  left: `${p.xStartVw}vw`,
                  top: `${p.yStartVh}vh`,
                  x: 0,
                  y: 0,
                  rotate: p.rotateStart,
                  scale: p.scale,
                  opacity: 0,
                }}
                animate={{
                  x: p.xDriftPx,
                  y: `${p.yEndVh - p.yStartVh}vh`,
                  rotate: p.rotateEnd,
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="fixed top-0 left-0 will-change-transform"
              >
                {p.shape === 'sparkle' ? (
                  <SparkleStarSvg size={12} className={p.palette.textClass} />
                ) : p.shape === 'dot' ? (
                  <span className={`block w-2.5 h-2.5 rounded-full ${p.palette.bgClass}`} />
                ) : p.shape === 'diamond' ? (
                  <span className={`block w-2.5 h-2.5 rotate-45 rounded-[2px] ${p.palette.bgClass}`} />
                ) : (
                  <span className={`block w-2.5 h-1.5 rounded-[1px] ${p.palette.bgClass}`} />
                )}
              </motion.div>
            ))}

          {/* Floating Achievement Banner */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.92 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            role="status"
            className={`pointer-events-auto relative w-full max-w-md rounded-2xl border shadow-2xl backdrop-blur-md px-4 py-3.5 overflow-hidden ${meta.badgeBg}`}
          >
            {/* Subtle top shimmer bar */}
            {!prefersReducedMotion && (
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
                className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${meta.accentGradient}`}
              />
            )}

            <div className="flex items-start gap-3">
              <motion.div
                initial={prefersReducedMotion ? undefined : { scale: 0.6, rotate: -18 }}
                animate={prefersReducedMotion ? undefined : { scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 460, damping: 20, delay: 0.05 }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${meta.iconBg}`}
              >
                {meta.icon}
              </motion.div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{meta.eyebrow}</span>
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {event.title}
                </p>
                {event.subtitle && (
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {event.subtitle}
                  </p>
                )}

                {event.kind === 'course' && event.certificate && onViewCertificate && (
                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        onViewCertificate(event.certificate!);
                        onDismiss();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver certificado oficial</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onDismiss}
                aria-label="Cerrar celebración"
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
