import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface CourseProgressBarProps {
  percent: number;
  label?: string;
  size?: 'sm' | 'md';
  showStatusText?: boolean;
  showHeader?: boolean;
}

export const CourseProgressBar: React.FC<CourseProgressBarProps> = ({
  percent,
  label = 'Progreso',
  size = 'sm',
  showStatusText = true,
  showHeader = true,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  const isCompleted = safePercent === 100;

  return (
    <div className="space-y-1.5">
      {showHeader && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
            {showStatusText && isCompleted ? 'Completado' : label}
          </span>
          <span
            className={`font-mono tabular-nums font-semibold shrink-0 ${
              isCompleted
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-blue-700 dark:text-blue-400'
            }`}
          >
            {safePercent}%
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={safePercent}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`relative w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden ${
          size === 'md' ? 'h-2.5' : 'h-1.5'
        }`}
      >
        <motion.div
          initial={false}
          animate={{ scaleX: safePercent / 100 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 260, damping: 28 }
          }
          className={`h-full w-full origin-left rounded-full ${
            isCompleted
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500'
              : 'bg-gradient-to-r from-[#0052CC] to-blue-500 dark:from-blue-500 dark:to-cyan-400'
          }`}
        />
      </div>
    </div>
  );
};
