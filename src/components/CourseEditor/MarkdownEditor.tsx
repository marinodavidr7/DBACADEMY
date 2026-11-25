import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bold,
  Code,
  Eye,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  Loader2,
  Plus,
  Sigma,
  UploadCloud,
  Video,
  X,
} from 'lucide-react';
import { uploadCourseMaterial } from '../../services/storageService';
import { renderMarkdown } from '../../utils/markdown';
import { Field } from './Field';

export type MarkdownTab = 'edit' | 'preview';

const CATEDRA_DIAGRAM_PRESETS = [
  {
    label: 'Hoja de Excel (Partes)',
    alt: 'Infografía: Partes principales de una hoja de cálculo de Excel',
    url: '/assets/aistudio/Infograf_a__Partes_principales_de_la_hoja_de_Excel_8da439cd.webp',
  },
  {
    label: 'Concepto: Columnas',
    alt: 'Esquema técnico: Columnas en Excel (Eje Vertical A–XFD)',
    url: '/assets/images/excel_concepto_columnas_1795446880239.jpg',
  },
  {
    label: 'Concepto: Filas',
    alt: 'Esquema técnico: Filas en Excel (Eje Horizontal 1–1.048.576)',
    url: '/assets/images/excel_concepto_filas_1795446901853.jpg',
  },
  {
    label: 'Concepto: Celda Activa',
    alt: 'Esquema técnico: Celda Activa, Cuadro de Nombres y Coordenadas (C4)',
    url: '/assets/images/excel_concepto_celda_activa_1795446902202.jpg',
  },
  {
    label: 'Concepto: Rangos',
    alt: 'Esquema técnico: Rangos continuos en Excel (B2:D5)',
    url: '/assets/images/excel_concepto_rangos_1795446902863.jpg',
  },
  {
    label: 'Columnas, Filas y Celdas',
    alt: 'Esquema: Cuadrícula bidimensional de Columnas, Filas, Celda B3 y Rango D2:E4',
    url: '/assets/images/excel_columnas_filas_celdas_1795446159490.jpg',
  },
  {
    label: 'Estructura Completa (Grid)',
    alt: 'Infografía unificada: Estructura completa de Columnas, Filas y Celda B3 en Excel',
    url: '/assets/images/excel_estructura_grid_completa_1795447779102.jpg',
  },
  {
    label: 'Jerarquía de Operadores',
    alt: 'Diagrama: Jerarquía de operadores en fórmulas de Excel',
    url: '/assets/images/excel_jerarquia_formulas_1795446160425.jpg',
  },
  {
    label: 'Tipos de Operadores',
    alt: 'Esquema: Operadores aritméticos, comparación y concatenación (&) en Excel',
    url: '/assets/images/excel_tipos_operadores_1795447919466.jpg',
  },
  {
    label: 'Anatomía de Función',
    alt: 'Infografía: Anatomía de una función en Excel (=SUMA)',
    url: '/assets/images/excel_anatomia_funcion_1795445064862.jpg',
  },
  {
    label: 'Referencias F4 ($A$1)',
    alt: 'Diagrama: Referencias Relativas, Absolutas ($A$1) y Mixtas (F4)',
    url: '/assets/images/excel_referencias_f4_1795445064452.jpg',
  },
  {
    label: 'Factura ITBIS (18%)',
    alt: 'Diagrama aplicado: Factura con Subtotal e ITBIS del 18% ($F$1)',
    url: '/assets/images/excel_itbis_factura_1795447883578.jpg',
  },
  {
    label: 'Errores Comunes',
    alt: 'Guía visual: Errores comunes en Excel y su corrección',
    url: '/assets/images/excel_errores_comunes_1795445065276.jpg',
  },
  {
    label: 'Flujo =SI()',
    alt: 'Diagrama de flujo: Función lógica =SI()',
    url: '/assets/images/excel_funcion_si_flujo_1795445065167.jpg',
  },
];

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
  courseId?: string;
  lessonId?: string;
  canEdit?: boolean;
  help?: string;
  error?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = memo(({
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
  courseId = 'general',
  lessonId = 'lesson',
  canEdit = true,
  help,
  error,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const [tab, setTab] = useState<MarkdownTab>('edit');
  const [split, setSplit] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1536px)').matches : false
  );
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [imgUrl, setImgUrl] = useState('');
  const [imgAlt, setImgAlt] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePanelError, setImagePanelError] = useState<string | null>(null);
  const [showVideoPanel, setShowVideoPanel] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoPanelError, setVideoPanelError] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1536px)');
    const update = () => setSplit(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!split && tab !== 'edit') return;
    const rafId = window.requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = 'auto';
      const targetHeight = Math.max(180, el.scrollHeight + 2);
      if (Math.abs(targetHeight - el.offsetHeight) > 2) {
        el.style.height = `${targetHeight}px`;
      } else {
        el.style.height = `${el.offsetHeight}px`;
      }
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [value, split, tab]);

  const previewHtml = useMemo(() => {
    if (!split && tab !== 'preview') return '';
    return value.trim() ? renderMarkdown(value) : '';
  }, [split, tab, value]);

  const apply = (transform: (before: string, selection: string, after: string) => string) => {
    const el = textareaRef.current;
    if (!el) return;
    const currentValue = valueRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = currentValue.slice(start, end);
    const [before, after] = [currentValue.slice(0, start), currentValue.slice(end)];
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
    const currentValue = valueRef.current;
    const start = el ? el.selectionStart : currentValue.length;
    const end = el ? el.selectionEnd : currentValue.length;
    const selected = currentValue.slice(start, end) || 'Texto';
    const next = `${currentValue.slice(0, start)}${block.replace('{text}', selected)}${currentValue.slice(end)}`;
    onChange(next);
    if (el) {
      requestAnimationFrame(() => el.focus());
    }
  };

  const insertImageMarkdown = (src: string, altText: string) => {
    const cleanAlt = (altText || 'Diagrama técnico de la lección').replace(/[\[\]]/g, '').trim();
    insertBlock(`\n![${cleanAlt}](${src.trim()})\n`);
    setImgUrl('');
    setImgAlt('');
    setImagePanelError(null);
    setShowImagePanel(false);
  };

  const handleInsertYoutubeUrl = () => {
    const trimmed = youtubeUrl.trim();
    if (!/^https?:\/\/\S+/i.test(trimmed)) {
      setVideoPanelError('Introduce una URL válida (ej. https://www.youtube.com/watch?v=...).');
      return;
    }
    insertBlock(`\n${trimmed}\n`);
    setYoutubeUrl('');
    setVideoPanelError(null);
    setShowVideoPanel(false);
  };

  const handleUploadInlineImage = async (file: File | undefined) => {
    if (!file) return;
    const ext = file.name.toLowerCase().split('.').pop() || '';
    const allowedExt = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif']);
    const isImage = file.type.startsWith('image/') || allowedExt.has(ext);
    if (!isImage) {
      setImagePanelError('Selecciona un archivo de imagen válido (PNG, JPG, WebP o GIF).');
      return;
    }
    setImagePanelError(null);
    setUploadingImage(true);
    try {
      const material = await uploadCourseMaterial(courseId, lessonId, file);
      const caption = imgAlt.trim() || file.name.replace(/\.[^.]+$/, '') || 'Ilustración técnica';
      insertImageMarkdown(material.url, caption);
    } catch (err) {
      console.error('Error al subir imagen en MarkdownEditor:', err);
      setImagePanelError(err instanceof Error ? err.message : 'No se pudo cargar la imagen.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInsertUrlImage = () => {
    const trimmed = imgUrl.trim();
    if (!trimmed) return;
    const isValid =
      /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/') || /^data:image\//i.test(trimmed);
    if (!isValid) {
      setImagePanelError('Ingresa una URL válida (https://... o /assets/...).');
      return;
    }
    insertImageMarkdown(trimmed, imgAlt.trim() || 'Ilustración técnica');
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
            <button
              type="button"
              aria-expanded={showVideoPanel}
              className={`${toolbarButton} ${
                showVideoPanel
                  ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                  : ''
              }`}
              title="Insertar video de YouTube (pega la URL en el contenido)"
              aria-label="Insertar video de YouTube"
              onClick={() => {
                setVideoPanelError(null);
                setShowImagePanel(false);
                setShowVideoPanel((prev) => !prev);
              }}
            >
              <Video className="h-4 w-4 text-red-500" />
            </button>
            <button
              type="button"
              aria-expanded={showImagePanel}
              className={`${toolbarButton} ${
                showImagePanel
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-cyan-300'
                  : ''
              }`}
              title="Cargar o vincular imagen en el contenido"
              aria-label="Cargar o vincular imagen en el contenido"
              onClick={() => {
                setShowVideoPanel(false);
                setShowImagePanel((prev) => !prev);
              }}
            >
              <ImageIcon className="h-4 w-4" />
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

        {showVideoPanel && (
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                <Video className="h-3.5 w-3.5 text-red-500" />
                <span>Insertar video de YouTube en el contenido</span>
              </div>
              <button
                type="button"
                onClick={() => setShowVideoPanel(false)}
                aria-label="Cerrar panel de video"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {videoPanelError && (
              <p className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-2.5 py-1.5 text-xs text-red-700 dark:text-red-300">
                {videoPanelError}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-center">
              <input
                type="url"
                autoFocus
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                  if (videoPanelError) setVideoPanelError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleInsertYoutubeUrl();
                  } else if (e.key === 'Escape') {
                    setShowVideoPanel(false);
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
                className="min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-base sm:text-xs text-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                disabled={!youtubeUrl.trim()}
                onClick={handleInsertYoutubeUrl}
                className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 px-3 py-1.5 text-xs font-semibold text-white transition-colors whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Insertar video</span>
              </button>
              <button
                type="button"
                onClick={() => setShowVideoPanel(false)}
                className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors whitespace-nowrap"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {showImagePanel && (
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                <ImageIcon className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
                <span>Insertar imagen técnica en el cuerpo de la teoría</span>
              </div>
              <button
                type="button"
                onClick={() => setShowImagePanel(false)}
                aria-label="Cerrar panel de imagen"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {imagePanelError && (
              <p className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-2.5 py-1.5 text-xs text-red-700 dark:text-red-300">
                {imagePanelError}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
              <input
                type="text"
                value={imgUrl}
                onChange={(e) => setImgUrl(e.target.value)}
                placeholder="URL de imagen (https://... o /assets/...)"
                className="min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-base sm:text-xs text-slate-800 dark:text-slate-100"
              />
              <input
                type="text"
                value={imgAlt}
                onChange={(e) => setImgAlt(e.target.value)}
                placeholder="Descripción o concepto (ej. Columnas, Filas y Celdas)"
                className="min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-base sm:text-xs text-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                disabled={!imgUrl.trim()}
                onClick={handleInsertUrlImage}
                className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-3 py-1.5 text-xs font-semibold text-white transition-colors whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Vincular</span>
              </button>
              {canEdit && (
                <>
                  <input
                    ref={imageFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      void handleUploadInlineImage(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => imageFileInputRef.current?.click()}
                    className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    ) : (
                      <UploadCloud className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
                    )}
                    <span>{uploadingImage ? 'Subiendo...' : 'Subir archivo'}</span>
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1">
                Biblioteca rápida:
              </span>
              {CATEDRA_DIAGRAM_PRESETS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => insertImageMarkdown(preset.url, preset.alt)}
                  className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-cyan-300 transition-colors"
                >
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

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
              {previewHtml ? (
                <div
                  className="prose-sm"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
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
});
