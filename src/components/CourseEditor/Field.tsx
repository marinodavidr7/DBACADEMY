import React from 'react';

export const editorInputClass =
  'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600';

export const editorLabelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5';

export const editorHelpClass = 'mt-1.5 text-sm text-slate-500 dark:text-slate-400';

export const editorErrorClass = 'mt-1.5 text-sm font-medium text-red-600 dark:text-red-400';

interface FieldProps {
  label: string;
  htmlFor?: string;
  help?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({ label, htmlFor, help, error, children, className = '' }) => (
  <div className={className}>
    <label htmlFor={htmlFor} className={editorLabelClass}>
      {label}
    </label>
    {children}
    {help && !error && <p className={editorHelpClass}>{help}</p>}
    {error && (
      <p className={editorErrorClass} role="alert">
        {error}
      </p>
    )}
  </div>
);
