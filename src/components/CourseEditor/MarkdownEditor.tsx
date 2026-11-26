import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  Code2,
  Eye,
  Image as ImageIcon,
  Loader2,
  PencilLine,
  Plus,
  UploadCloud,
  Video,
  X,
} from 'lucide-react';
import { uploadCourseMaterial } from '../../services/storageService';
import { normalizarUrlImagen } from '../../utils/imageUtils';
import {
  COMPARISON_SIM_TOKEN,
  isComparisonSimulatorSource,
  isSafeIframeSrc,
  renderLessonContent,
  sanitizeHtml,
  sanitizeStyle,
} from '../../utils/richText';
import { RichLessonContent } from '../RichLessonContent';
import { Field } from './Field';

const IFRAME_ATTRIBUTES = [
  'title',
  'width',
  'height',
  'loading',
  'allow',
  'allowfullscreen',
  'sandbox',
  'referrerpolicy',
  'frameborder',
  'style',
] as const;

let customBlotsRegistered = false;
function ensureCustomQuillBlots(): void {
  if (customBlotsRegistered || typeof window === 'undefined') return;
  customBlotsRegistered = true;
  try {
    const QuillCtor = ReactQuill.Quill;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const BaseImage = QuillCtor.import('formats/image') as any;
    if (BaseImage) {
      class SafeImageBlot extends BaseImage {
        static create(value: unknown) {
          const node = super.create(value) as HTMLImageElement;
          node.setAttribute('referrerpolicy', 'no-referrer');
          node.setAttribute('loading', 'lazy');
          return node;
        }

        static sanitize(url: string) {
          const trimmed = (url || '').trim();
          if (
            /^https?:\/\//i.test(trimmed) ||
            trimmed.startsWith('/') ||
            /^data:image\//i.test(trimmed)
          ) {
            return trimmed;
          }
          return '//:0';
        }
      }

      QuillCtor.register(SafeImageBlot, true);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const BlockEmbed = QuillCtor.import('blots/block/embed') as any;
    if (BlockEmbed) {
      class SafeIframeBlot extends BlockEmbed {
        static blotName = 'embedIframe';
        static tagName = 'IFRAME';

        static create(value: unknown) {
          const node = super.create(value) as HTMLIFrameElement;
          const rawUrl = typeof value === 'string' ? value : '';
          const safeSrc = SafeIframeBlot.sanitize(rawUrl);
          if (safeSrc) {
            node.setAttribute('src', safeSrc);
          }
          node.setAttribute('loading', 'lazy');
          node.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
          node.setAttribute('frameborder', '0');
          return node;
        }

        static sanitize(url: string) {
          const trimmed = (url || '').trim();
          return isSafeIframeSrc(trimmed) ? trimmed : '';
        }

        static value(domNode: HTMLElement) {
          const src = (domNode.getAttribute('src') || '').trim();
          return isSafeIframeSrc(src) ? src : null;
        }

        static formats(domNode: HTMLElement) {
          const formats: Record<string, string> = {};
          for (const attr of IFRAME_ATTRIBUTES) {
            if (attr === 'allowfullscreen') {
              if (domNode.hasAttribute('allowfullscreen')) {
                formats.allowfullscreen = domNode.getAttribute('allowfullscreen') || 'true';
              }
            } else if (domNode.hasAttribute(attr)) {
              const val = domNode.getAttribute(attr);
              if (val !== null && val !== '') {
                formats[attr] = attr === 'style' ? sanitizeStyle(val) : val;
              }
            }
          }
          return formats;
        }

        format(name: string, value: unknown) {
          if ((IFRAME_ATTRIBUTES as readonly string[]).includes(name)) {
            if (name === 'allowfullscreen') {
              if (value) {
                this.domNode.setAttribute('allowfullscreen', value === true || value === 'true' ? '' : String(value));
              } else {
                this.domNode.removeAttribute('allowfullscreen');
              }
            } else if (name === 'style') {
              const cleanStyle = typeof value === 'string' ? sanitizeStyle(value) : '';
              if (cleanStyle) {
                this.domNode.setAttribute('style', cleanStyle);
              } else {
                this.domNode.removeAttribute('style');
              }
            } else if (value) {
              this.domNode.setAttribute(name, String(value));
            } else {
              this.domNode.removeAttribute(name);
            }
          } else {
            super.format(name, value);
          }
        }
      }

      QuillCtor.register(SafeIframeBlot, true);
    }
  } catch (err) {
    console.warn('No se pudieron registrar los blots personalizados en Quill:', err);
  }
}

function verifyImageLoads(url: string, timeoutMs = 8000): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(true);
  if (url.startsWith('data:image/')) return Promise.resolve(true);
  return new Promise((resolve) => {
    const probe = new Image();
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(ok);
    };
    const timer = window.setTimeout(() => finish(true), timeoutMs);
    probe.referrerPolicy = 'no-referrer';
    probe.onload = () => finish(probe.naturalWidth > 0);
    probe.onerror = () => finish(false);
    probe.src = url;
  });
}

export type MarkdownTab = 'edit' | 'preview';

const CATEDRA_DIAGRAM_PRESETS = [
  { label: 'Hoja de Excel (Partes)', alt: 'Infografía: Partes principales de una hoja de cálculo de Excel', url: '/assets/aistudio/Infograf_a__Partes_principales_de_la_hoja_de_Excel_8da439cd.webp' },
  { label: 'Concepto: Columnas', alt: 'Esquema técnico: Columnas en Excel (Eje Vertical A–XFD)', url: '/assets/images/excel_concepto_columnas_1795446880239.jpg' },
  { label: 'Concepto: Filas', alt: 'Esquema técnico: Filas en Excel (Eje Horizontal 1–1.048.576)', url: '/assets/images/excel_concepto_filas_1795446901853.jpg' },
  { label: 'Concepto: Celda Activa', alt: 'Esquema técnico: Celda Activa, Cuadro de Nombres y Coordenadas (C4)', url: '/assets/images/excel_concepto_celda_activa_1795446902202.jpg' },
  { label: 'Concepto: Rangos', alt: 'Esquema técnico: Rangos continuos en Excel (B2:D5)', url: '/assets/images/excel_concepto_rangos_1795446902863.jpg' },
  { label: 'Estructura Completa (Grid)', alt: 'Infografía unificada: Estructura completa de Columnas, Filas y Celda B3 en Excel', url: '/assets/images/excel_estructura_grid_completa_1795447779102.jpg' },
];

interface MarkdownEditorProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  editLabel?: string;
  previewLabel?: string;
  previewEmpty?: string;
  boldLabel?: string;
  italicLabel?: string;
  listLabel?: string;
  codeLabel?: string;
  formulaLabel?: string;
  linkLabel?: string;
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
  editLabel = 'Editar',
  previewLabel = 'Vista previa',
  previewEmpty = 'Sin contenido para previsualizar.',
  courseId = 'general',
  lessonId = 'lesson',
  canEdit = true,
  help,
  error,
}) => {
  const quillRef = useRef<ReactQuill | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const [tab, setTab] = useState<MarkdownTab>('edit');
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [showVideoPanel, setShowVideoPanel] = useState(false);
  const [showEmbedPanel, setShowEmbedPanel] = useState(false);
  const [imgUrl, setImgUrl] = useState('');
  const [imgAlt, setImgAlt] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePanelError, setImagePanelError] = useState<string | null>(null);
  const [videoPanelError, setVideoPanelError] = useState<string | null>(null);
  const [embedPanelError, setEmbedPanelError] = useState<string | null>(null);

  ensureCustomQuillBlots();

  const insertHtmlAtCursor = useCallback((html: string) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) {
      const next = value ? `${value}\n${html}` : html;
      onChange(sanitizeHtml(next));
      setTab('edit');
      return;
    }
    const range = quill.getSelection(false);
    const index = range?.index ?? Math.max(0, quill.getLength() - 1);
    const pasteDelta = quill.clipboard.convert({ html });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DeltaCtor = ReactQuill.Quill.import('delta') as any;
    if (DeltaCtor && pasteDelta?.ops?.length) {
      const update = new DeltaCtor().retain(index).concat(pasteDelta).insert('\n');
      quill.updateContents(update, 'user');
      quill.setSelection(index + pasteDelta.length() + 1, 0, 'silent');
    } else {
      quill.clipboard.dangerouslyPasteHTML(index, html, 'user');
      quill.setSelection(index + 1, 0, 'silent');
    }
  }, [onChange, value]);

  const insertImage = useCallback((src: string, altText: string) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const cleanSrc = normalizarUrlImagen(src) || src.trim();
    const isValid =
      /^https?:\/\//i.test(cleanSrc) ||
      cleanSrc.startsWith('/') ||
      /^data:image\//i.test(cleanSrc);
    if (!isValid) {
      setImagePanelError('La fuente de la imagen no es válida.');
      return;
    }
    const cleanAlt = (altText || 'Imagen de la lección').trim();
    const range = quill.getSelection(true);
    const index = range?.index ?? Math.max(0, quill.getLength() - 1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DeltaCtor = ReactQuill.Quill.import('delta') as any;
    if (DeltaCtor) {
      const update = new DeltaCtor()
        .retain(index)
        .insert({ image: cleanSrc }, { alt: cleanAlt })
        .insert('\n');
      quill.updateContents(update, 'user');
    } else {
      quill.insertEmbed(index, 'image', cleanSrc, 'user');
      quill.formatText(index, 1, 'alt', cleanAlt, 'user');
      quill.insertText(index + 1, '\n', 'user');
    }
    quill.setSelection(index + 2, 0, 'silent');
    setImgUrl('');
    setImgAlt('');
    setImagePanelError(null);
    setShowImagePanel(false);
  }, []);

  const handleUploadInlineImage = async (file: File | undefined) => {
    if (!file) return;
    const ext = file.name.toLowerCase().split('.').pop() || '';
    const allowedExt = new Set(['png', 'jpg', 'jpeg', 'jfif', 'webp', 'gif', 'svg', 'avif', 'bmp']);
    const isImage = file.type.startsWith('image/') || allowedExt.has(ext);
    if (!isImage) {
      setImagePanelError('Selecciona un archivo de imagen válido (PNG, JPG, WebP o GIF).');
      return;
    }
    setImagePanelError(null);
    setUploadingImage(true);
    try {
      const material = await uploadCourseMaterial(courseId, lessonId, file);
      if (!material.url || (!material.url.startsWith('data:image/') && !/^https?:\/\//i.test(material.url) && !material.url.startsWith('/'))) {
        throw new Error('No se pudo generar una URL válida para la imagen.');
      }
      const caption = imgAlt.trim() || file.name.replace(/\.[^.]+$/, '') || 'Imagen de la lección';
      insertImage(material.url, caption);
    } catch (err) {
      console.error('Error al subir imagen en MarkdownEditor:', err);
      setImagePanelError(err instanceof Error ? err.message : 'No se pudo cargar la imagen.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInsertUrlImage = async () => {
    const raw = imgUrl.trim();
    if (!raw) return;
    // Allow pasting markdown image syntax or <img src="..."> accidentally
    const mdMatch = raw.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    const htmlMatch = raw.match(/src=["']([^"']+)["']/i);
    const extracted = mdMatch?.[2] || htmlMatch?.[1] || raw;
    const normalized = normalizarUrlImagen(extracted) || extracted.trim();
    const isValid = /^https?:\/\//i.test(normalized) || normalized.startsWith('/') || /^data:image\//i.test(normalized);
    if (!isValid) {
      setImagePanelError('Ingresa una URL válida (https://... o /assets/...).');
      return;
    }
    setImagePanelError(null);
    setUploadingImage(true);
    try {
      const ok = await verifyImageLoads(normalized);
      if (!ok) {
        setImagePanelError('No se pudo cargar la imagen desde esa URL. Verifica que el enlace sea público y apunte directamente a una imagen.');
        return;
      }
      insertImage(normalized, imgAlt.trim() || mdMatch?.[1] || 'Imagen de la lección');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInsertYoutubeUrl = () => {
    const trimmed = youtubeUrl.trim();
    if (!/^https?:\/\/\S+/i.test(trimmed)) {
      setVideoPanelError('Introduce una URL válida (ej. https://www.youtube.com/watch?v=...).');
      return;
    }
    insertHtmlAtCursor(`<p><a href="${trimmed.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">${trimmed}</a></p><p><br></p>`);
    setYoutubeUrl('');
    setVideoPanelError(null);
    setShowVideoPanel(false);
  };

  const handleInsertSimulatorToken = useCallback(() => {
    insertHtmlAtCursor(`<p>${COMPARISON_SIM_TOKEN}</p><p><br></p>`);
    setEmbedCode('');
    setEmbedPanelError(null);
    setShowEmbedPanel(false);
  }, [insertHtmlAtCursor]);

  const handleInsertEmbedCode = () => {
    const trimmed = embedCode.trim();
    if (!trimmed) return;
    if (isComparisonSimulatorSource(trimmed)) {
      handleInsertSimulatorToken();
      return;
    }
    const htmlCandidate =
      isSafeIframeSrc(trimmed) && !/\s/.test(trimmed)
        ? `<iframe src="${trimmed.replace(/"/g, '&quot;')}" width="100%" height="560" loading="lazy" allowfullscreen></iframe>`
        : trimmed;
    const sanitized = sanitizeHtml(htmlCandidate);
    if (!sanitized.trim()) {
      setEmbedPanelError('El código no es válido o fue bloqueado por seguridad. Usa iframe/HTML con https.');
      return;
    }

    const quill = quillRef.current?.getEditor();
    if (!quill) {
      const combined = value ? `${value}\n${sanitized}<p><br></p>` : `${sanitized}<p><br></p>`;
      onChange(sanitizeHtml(combined));
      setEmbedCode('');
      setEmbedPanelError(null);
      setShowEmbedPanel(false);
      setTab('edit');
      return;
    }

    const pasteDelta = quill.clipboard.convert({ html: sanitized });
    if (!pasteDelta || !pasteDelta.ops || pasteDelta.length() === 0) {
      setEmbedPanelError('No se reconoció contenido HTML o iframe válido para insertar.');
      return;
    }

    const range = quill.getSelection(false);
    const index = range?.index ?? Math.max(0, quill.getLength() - 1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DeltaCtor = ReactQuill.Quill.import('delta') as any;
    if (DeltaCtor) {
      const update = new DeltaCtor().retain(index).concat(pasteDelta).insert('\n');
      quill.updateContents(update, 'user');
      quill.setSelection(index + pasteDelta.length() + 1, 0, 'silent');
    } else {
      quill.clipboard.dangerouslyPasteHTML(index, `${sanitized}<p><br></p>`, 'user');
    }

    setEmbedCode('');
    setEmbedPanelError(null);
    setShowEmbedPanel(false);
  };

  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'clean'],
    ],
    clipboard: { matchVisual: false },
  }), []);

  const formats = useMemo(() => [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'align',
    'list',
    'blockquote', 'code-block',
    'link', 'image', 'embedIframe',
  ], []);

  const previewHtml = useMemo(() => {
    if (tab !== 'preview') return '';
    return renderLessonContent(value);
  }, [tab, value]);

  return (
    <Field label={label} help={help} error={error}>
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 px-2 py-1.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-expanded={showImagePanel}
              className={`inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${showImagePanel ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title="Insertar imagen"
              onClick={() => { setShowVideoPanel(false); setShowEmbedPanel(false); setShowImagePanel((p) => !p); }}
            >
              <ImageIcon className="h-4 w-4" />
              <span>Imagen</span>
            </button>
            <button
              type="button"
              aria-expanded={showVideoPanel}
              className={`inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${showVideoPanel ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title="Insertar enlace de video"
              onClick={() => { setShowImagePanel(false); setShowEmbedPanel(false); setShowVideoPanel((p) => !p); }}
            >
              <Video className="h-4 w-4 text-red-500" />
              <span>Video</span>
            </button>
            <button
              type="button"
              aria-expanded={showEmbedPanel}
              className={`inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${showEmbedPanel ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title="Insertar código HTML/Embed (iframe, simulador 3D, etc.)"
              onClick={() => { setShowImagePanel(false); setShowVideoPanel(false); setShowEmbedPanel((p) => !p); }}
            >
              <Code2 className="h-4 w-4" />
              <span>Embed/HTML</span>
            </button>
          </div>

          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setTab('edit')}
              aria-pressed={tab === 'edit'}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium ${tab === 'edit' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <PencilLine className="h-3.5 w-3.5" />
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
                <span>Insertar enlace de video en el contenido</span>
              </div>
              <button type="button" onClick={() => setShowVideoPanel(false)} aria-label="Cerrar panel de video" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800"><X className="h-3.5 w-3.5" /></button>
            </div>
            {videoPanelError && <p className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-2.5 py-1.5 text-xs text-red-700 dark:text-red-300">{videoPanelError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-center">
              <input type="url" value={youtubeUrl} onChange={(e) => { setYoutubeUrl(e.target.value); if (videoPanelError) setVideoPanelError(null); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleInsertYoutubeUrl(); } }} placeholder="https://www.youtube.com/watch?v=..." className="min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-base sm:text-xs text-slate-800 dark:text-slate-100" />
              <button type="button" disabled={!youtubeUrl.trim()} onClick={handleInsertYoutubeUrl} className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 px-3 py-1.5 text-xs font-semibold text-white transition-colors whitespace-nowrap"><Plus className="h-3.5 w-3.5" /><span>Insertar</span></button>
              <button type="button" onClick={() => setShowVideoPanel(false)} className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors whitespace-nowrap">Cancelar</button>
            </div>
          </div>
        )}

        {showEmbedPanel && (
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                <Code2 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                <span>Insertar código HTML / Embed (iframe, simulador 3D, etc.)</span>
              </div>
              <button type="button" onClick={() => setShowEmbedPanel(false)} aria-label="Cerrar panel embed" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800"><X className="h-3.5 w-3.5" /></button>
            </div>
            {embedPanelError && <p className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-2.5 py-1.5 text-xs text-red-700 dark:text-red-300">{embedPanelError}</p>}
            <textarea
              value={embedCode}
              onChange={(e) => { setEmbedCode(e.target.value); if (embedPanelError) setEmbedPanelError(null); }}
              placeholder={'Pega aquí el código embed. Ejemplo:\n<iframe src="https://..." width="100%" height="480" allowfullscreen></iframe>'}
              rows={5}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-100"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" disabled={!embedCode.trim()} onClick={handleInsertEmbedCode} className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 px-3 py-1.5 text-xs font-semibold text-white transition-colors"><Plus className="h-3.5 w-3.5" /><span>Insertar embed</span></button>
              <button type="button" onClick={handleInsertSimulatorToken} className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 transition-colors"><Plus className="h-3.5 w-3.5" /><span>Simulador: Operadores de Comparación</span></button>
              <button type="button" onClick={() => setShowEmbedPanel(false)} className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors">Cancelar</button>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Solo HTTPS. Scripts bloqueados por seguridad.</span>
            </div>
          </div>
        )}

        {showImagePanel && (
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                <ImageIcon className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
                <span>Insertar imagen en el contenido</span>
              </div>
              <button type="button" onClick={() => setShowImagePanel(false)} aria-label="Cerrar panel de imagen" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800"><X className="h-3.5 w-3.5" /></button>
            </div>
            {imagePanelError && <p className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-2.5 py-1.5 text-xs text-red-700 dark:text-red-300">{imagePanelError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
              <input type="text" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleInsertUrlImage(); } }} placeholder="URL de imagen (https://... o Google Drive)" className="min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-base sm:text-xs text-slate-800 dark:text-slate-100" />
              <input type="text" value={imgAlt} onChange={(e) => setImgAlt(e.target.value)} placeholder="Descripción (alt)" className="min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-base sm:text-xs text-slate-800 dark:text-slate-100" />
              <button type="button" disabled={!imgUrl.trim() || uploadingImage} onClick={() => void handleInsertUrlImage()} className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-3 py-1.5 text-xs font-semibold text-white transition-colors whitespace-nowrap"><Plus className="h-3.5 w-3.5" /><span>Vincular</span></button>
              {canEdit && (
                <>
                  <input ref={imageFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void handleUploadInlineImage(e.target.files?.[0]); e.target.value = ''; }} />
                  <button type="button" disabled={uploadingImage} onClick={() => imageFileInputRef.current?.click()} className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap">
                    {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" /> : <UploadCloud className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />}
                    <span>{uploadingImage ? 'Subiendo...' : 'Subir archivo'}</span>
                  </button>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1">Biblioteca rápida:</span>
              {CATEDRA_DIAGRAM_PRESETS.map((preset) => (
                <button key={preset.url} type="button" onClick={() => insertImage(preset.url, preset.alt)} className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-cyan-300 transition-colors">
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'edit' ? (
          <div className="dba-quill-wrap">
            <ReactQuill
              ref={quillRef}
              id={id}
              theme="snow"
              value={value || ''}
              onChange={(content) => {
                // Quill returns '<p><br></p>' for empty
                const isEmpty = content === '<p><br></p>' || content === '<p></p>' || !content;
                onChange(isEmpty ? '' : sanitizeHtml(content));
              }}
              modules={modules}
              formats={formats}
              placeholder={placeholder}
              readOnly={!canEdit}
            />
          </div>
        ) : (
          <div className="px-4 py-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200 min-h-[180px]">
            {previewHtml ? (
              <RichLessonContent content={value} className="prose-sm dba-rich-content" />
            ) : (
              <p className="text-slate-400 dark:text-slate-500">{previewEmpty}</p>
            )}
          </div>
        )}
      </div>
    </Field>
  );
});
