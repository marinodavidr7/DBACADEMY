import React from 'react';
import { AlertCircle, CheckCircle2, Undo2, X } from 'lucide-react';
import { motion } from 'motion/react';

export interface ToastItem {
  id: string;
  message: string;
  variant?: 'success' | 'error' | 'info';
  kind?: 'save-status' | 'info';
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastStackProps {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastStack: React.FC<ToastStackProps> = ({ items, onDismiss }) => {
  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(92vw,360px)] flex-col gap-2">
      {items.map((item) => (
        <motion.div
          key={item.id}
          layout
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }}
          className={`pointer-events-auto flex items-center gap-3 rounded-xl border bg-white dark:bg-[#111827] px-4 py-3 shadow-xl ${
            item.variant === 'error'
              ? 'border-red-200 dark:border-red-900/70'
              : item.variant === 'success'
                ? 'border-emerald-200 dark:border-emerald-900/70'
                : 'border-slate-200 dark:border-slate-700'
          }`}
          role="status"
        >
          {item.variant === 'success' && (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          {item.variant === 'error' && (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          )}
          <span className="flex-1 text-sm text-slate-800 dark:text-slate-100">{item.message}</span>
          {item.actionLabel && item.onAction && (
            <button
              type="button"
              onClick={() => {
                item.onAction?.();
                onDismiss(item.id);
              }}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              <Undo2 className="h-3.5 w-3.5" />
              {item.actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            aria-label="Cerrar aviso"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      ))}
    </div>
  );
};
