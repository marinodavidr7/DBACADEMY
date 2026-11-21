import React, { useEffect, useRef, useState } from 'react';
import { Bold, Code, Eye, Italic, Link2, List, Sigma } from 'lucide-react';
import { renderMarkdown } from '../../utils/markdown';
import { Field } from './Field';

export type MarkdownTab = 'edit' | 'preview';

interface MarkdownEditorProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  editLabel: string;
  previewLabel: string;
  previewEmpty: string;
  boldLabel: string;
  italicLabel: string;
  listLabel: string;
  codeLabel: string;
  formulaLabel: string;
  linkLabel: string;
  help?: string;
  error?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  editLabel,
  previewLabel,
  previewEmpty,
  boldLabel,
  italicLabel,
  listLabel,
  codeLabel,
  formulaLabel,
  linkLabel,
  help,
  error,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [tab, setTab] = useState<MarkdownTab>('edit');
  const [split, setSplit] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1536px)');
    const update = () => setSplit(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(180, el.scrollHeight + 2)}px`;
  };

  useEffect(() => {
    autoGrow();
  }, [value]);

  const apply = (transform: (before: string, selection: string, after: string) => string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const [before, after] = [value.slice(0, start), value.slice(end)];
    const next = transform(before, selected, after);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + selected.length + 2;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const insertBlock = (block: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || 'Texto';
    const next = `${value.slice(0, start)}${block.replace('{text}', selected)}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => el.focus());
  };

  const toolbarButton =
    'inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600';

  return (
    <Field label={label} help={help} error={error}>
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 px-2 py-1.5">
          <div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label={label}>
            <button type="button" className={toolbarButton} title={boldLabel} aria-label={boldLabel} onClick={() => apply((b, s, a) => `${b}**${s || 'texto'}**${a}`)}>
              <Bold className="h-4 w-4" />
            </button>
            <button type="button" className={toolbarButton} title={italicLabel} aria-label={italicLabel} onClick={() => apply((b, s, a) => `${b}*${s || 'texto'}*${a}`)}>
              <Italic className="h-4 w-4" />
            </button>
            <button type="button" className={toolbarButton} title={listLabel} aria-label={listLabel} onClick={() => insertBlock('\n- {text}\n')}>
              <List className="h-4 w-4" />
            </button>
            <button type="button" className={toolbarButton} title={codeLabel} aria-label={codeLabel} onClick={() => apply((b, s, a) => `${b}\`${s || 'código'}\`${a}`)}>
              <Code className="h-4 w-4" />
            </button>
            <button type="button" className={toolbarButton} title={formulaLabel} aria-label={formulaLabel} onClick={() => insertBlock('\n```\n=FÓRMULA()\n```\n')}>
              <Sigma className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={toolbarButton}
              title={linkLabel}
              aria-label={linkLabel}
              onClick={() => insertBlock('[texto del enlace](https://ejemplo.com)')}
            >
              <Link2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setTab('edit')}
              aria-pressed={tab === 'edit'}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === 'edit' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {editLabel}
            </button>
            <button
              type="button"
              onClick={() => setTab('preview')}
              aria-pressed={tab === 'preview'}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium ${tab === 'preview' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <Eye className="h-3.5 w-3.5" />
              {previewLabel}
            </button>
          </div>
        </div>

        <div className={`grid gap-0 ${split ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {split || tab === 'edit' ? (
            <textarea
              ref={textareaRef}
              id={id}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder}
              rows={8}
              className="min-h-[180px] w-full resize-y bg-transparent px-4 py-3 text-sm leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
          ) : null}
          {split || tab === 'preview' ? (
            <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200 max-w-[75ch]">
              {split && <div className="border-l border-slate-200 dark:border-slate-700" />}
              {value.trim() ? (
                <div
                  className="prose-sm"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
                />
              ) : (
                <p className="text-slate-400 dark:text-slate-500">{previewEmpty}</p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </Field>
  );
};
