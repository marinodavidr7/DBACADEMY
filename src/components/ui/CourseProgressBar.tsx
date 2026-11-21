import React from 'react';

interface CourseProgressBarProps {
  percent: number;
  label?: string;
  size?: 'sm' | 'md';
  showStatusText?: boolean;
}

export const CourseProgressBar: React.FC<CourseProgressBarProps> = ({
  percent,
  label = 'Progreso',
  size = 'sm',
  showStatusText = true,
}) => {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  const isCompleted = safePercent === 100;

  return (
    <div className="space-y-1.5">
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
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={safePercent}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden ${
          size === 'md' ? 'h-2.5' : 'h-1.5'
        }`}
      >
        <div
          style={{ width: `${safePercent}%` }}
          className={`h-full rounded-full transition-[width] duration-300 ease-out ${
            isCompleted ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-[#0052CC] dark:bg-blue-500'
          }`}
        />
      </div>
    </div>
  );
};
