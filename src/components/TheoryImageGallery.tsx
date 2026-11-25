import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  GripVertical,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  Loader2,
  Maximize2,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { CourseMaterial } from '../types';
import {
  buildExternalMaterial,
  uploadCourseMaterial,
} from '../services/storageService';
import { esGoogleDriveUrl, normalizarUrlImagen } from '../utils/imageUtils';

export interface CatedraImagePreset {
  label: string;
  title: string;
  description: string;
  url: string;
  sizeByte: number;
}

export const CATEDRA_GALLERY_PRESETS: CatedraImagePreset[] = [
  {
    label: 'Hoja de Excel (Partes)',
    title: 'Partes principales de una hoja de cálculo de Excel',
    description:
      'Mapa visual de la interfaz completa: Cinta de opciones, Cuadro de nombres, Barra de fórmulas, Celda activa, Columnas (letras), Filas (números), pestañas de Hojas y Barra de zoom.',
    url: '/assets/aistudio/Infograf_a__Partes_principales_de_la_hoja_de_Excel_8da439cd.webp',
    sizeByte: 107702,
  },
  {
    label: 'Concepto: Columnas',
    title: 'Columnas en Excel: Eje Vertical (A hasta XFD)',
    description:
      'Las columnas corren de arriba hacia abajo y se identifican con letras (A, B, C... hasta XFD), sumando 16.384 columnas por hoja. Al pulsar la letra superior seleccionas la columna completa.',
    url: '/assets/images/excel_concepto_columnas_1795446880239.jpg',
    sizeByte: 437622,
  },
  {
    label: 'Concepto: Filas',
    title: 'Filas en Excel: Eje Horizontal (1 hasta 1.048.576)',
    description:
      'Las filas se disponen de izquierda a derecha con encabezados numéricos del 1 al 1.048.576. Hacer clic en el número izquierdo selecciona toda la fila horizontal.',
    url: '/assets/images/excel_concepto_filas_1795446901853.jpg',
    sizeByte: 469026,
  },
  {
    label: 'Concepto: Celda Activa',
    title: 'Celda Activa, Coordenadas y Cuadro de Nombres (C4)',
    description:
      'La celda nace en la intersección de una columna y una fila (Columna C + Fila 4 = C4). El Cuadro de nombres muestra esa coordenada y la Barra de fórmulas exhibe su contenido real.',
    url: '/assets/images/excel_concepto_celda_activa_1795446902202.jpg',
    sizeByte: 510611,
  },
  {
    label: 'Concepto: Rangos',
    title: 'Rangos Continuos en Excel (B2:D5)',
    description:
      'Un rango agrupa múltiples celdas contiguas separadas por dos puntos (:), indicando celda inicial superior izquierda y celda final inferior derecha (B2:D5 = 12 celdas).',
    url: '/assets/images/excel_concepto_rangos_1795446902863.jpg',
    sizeByte: 440221,
  },
  {
    label: 'Columnas, Filas y Celdas (Resumen)',
    title: 'Cuadrícula bidimensional: Columnas, Filas, Celda B3 y Rango D2:E4',
    description:
      'Representación estructural de la cuadrícula: 16.384 columnas verticales (A hasta XFD), 1.048.576 filas horizontales, coordenada única de intersección (B3) y notación de rango continuo (D2:E4).',
    url: '/assets/images/excel_columnas_filas_celdas_1795446159490.jpg',
    sizeByte: 333205,
  },
  {
    label: 'Estructura Completa (Grid)',
    title: 'Estructura completa de la cuadrícula: Columnas, Filas y Celda B3',
    description:
      'Infografía unificada de conceptos básicos: encabezados alfabéticos de columna, encabezados numéricos de fila, barra de fórmulas y celda activa B3.',
    url: '/assets/images/excel_estructura_grid_completa_1795447779102.jpg',
    sizeByte: 453911,
  },
  {
    label: 'Jerarquía de Operadores',
    title: 'Jerarquía de evaluación de operadores en fórmulas de Excel',
    description:
      'Orden estricto de cálculo en Excel: 1) Paréntesis (), 2) Potencia ^ y porcentaje %, 3) Multiplicación * y división /, 4) Suma + y resta -. Incluye contraste práctico entre =(2+3)*4 y =2+3*4.',
    url: '/assets/images/excel_jerarquia_formulas_1795446160425.jpg',
    sizeByte: 426537,
  },
  {
    label: 'Tipos de Operadores',
    title: 'Tipos de operadores en Excel: aritméticos, comparación y texto (&)',
    description:
      'Resumen visual de jerarquía aritmética junto a los operadores de concatenación (&) y comparación lógica (=, >, <, <>).',
    url: '/assets/images/excel_tipos_operadores_1795447919466.jpg',
    sizeByte: 459683,
  },
  {
    label: 'Anatomía =SUMA()',
    title: 'Anatomía universal de una función en Excel (=SUMA)',
    description:
      'Desglose sintáctico pieza por pieza: signo igual (=) obligatorio, nombre oficial de la función, paréntesis delimitadores y argumentos separados por punto y coma (;).',
    url: '/assets/images/excel_anatomia_funcion_1795445064862.jpg',
    sizeByte: 465650,
  },
  {
    label: 'Referencias $A$1 (F4)',
    title: 'Referencias Relativas, Absolutas ($A$1) y Mixtas (Tecla F4)',
    description:
      'Comparativa técnica del comportamiento al arrastrar fórmulas con el controlador de relleno y uso del signo dólar ($) con la tecla F4 para fijar tasas fijas como el ITBIS.',
    url: '/assets/images/excel_referencias_f4_1795445064452.jpg',
    sizeByte: 429923,
  },
  {
    label: 'Factura ITBIS (18%)',
    title: 'Factura reactiva con Subtotal e ITBIS (18%) en $F$1',
    description:
      'Caso práctico completo de multiplicación de cantidad por precio y cálculo del 18% de ITBIS anclado en referencia absoluta.',
    url: '/assets/images/excel_itbis_factura_1795447883578.jpg',
    sizeByte: 446648,
  },
  {
    label: 'Errores Comunes',
    title: 'Guía rápida de diagnóstico de errores frecuentes en Excel',
    description:
      'Identificación y resolución inmediata de #¡DIV/0!, #¿NOMBRE?, #¡VALOR!, #REF!, #N/A y ##### según su causa raíz en fórmulas y anchos de columna.',
    url: '/assets/images/excel_errores_comunes_1795445065276.jpg',
    sizeByte: 667178,
  },
  {
    label: 'Flujo =SI()',
    title: 'Diagrama lógico de decisión con la función =SI()',
    description:
      'Árbol de evaluación condicional: validación de prueba_lógica y bifurcación determinista hacia valor_si_verdadero o valor_si_falso.',
    url: '/assets/images/excel_funcion_si_flujo_1795445065167.jpg',
    sizeByte: 401570,
  },
];

export interface ImageLightboxModalProps {
  images?: CourseMaterial[];
  activeIndex?: number;
  singleImage?: CourseMaterial | null;
  onSelectIndex?: (nextIndex: number) => void;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  images = [],
  activeIndex = 0,
  singleImage = null,
  onSelectIndex,
  onClose,
}) => {
  const [zoomed, setZoomed] = useState(false);

  const isGallery = images.length > 0 && !singleImage;
  const activeModalImage = singleImage ?? (isGallery ? images[activeIndex] ?? null : null);

  useEffect(() => {
    setZoomed(false);
  }, [activeModalImage?.id, activeModalImage?.url]);

  useEffect(() => {
    if (!activeModalImage) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (isGallery && images.length > 1 && onSelectIndex && e.key === 'ArrowLeft') {
        onSelectIndex((activeIndex - 1 + images.length) % images.length);
      } else if (isGallery && images.length > 1 && onSelectIndex && e.key === 'ArrowRight') {
        onSelectIndex((activeIndex + 1) % images.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModalImage, isGallery, images.length, activeIndex, onSelectIndex, onClose]);

  if (!activeModalImage) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={activeModalImage.name}
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/92 backdrop-blur-sm p-2 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl max-h-[92dvh] flex flex-col rounded-2xl border border-slate-700 bg-[#0B1222] overflow-hidden shadow-2xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 sm:px-5 py-3 border-b border-slate-800 bg-[#0F172A]">
          <div className="min-w-0 flex items-center gap-2.5 flex-1">
            {isGallery && (
              <span className="shrink-0 rounded-md bg-blue-600/20 border border-blue-500/40 px-2 py-0.5 font-mono tabular-nums text-[11px] font-semibold text-cyan-300">
                {activeIndex + 1} / {images.length}
              </span>
            )}
            <p className="text-xs sm:text-sm font-semibold text-white truncate">
              {activeModalImage.name}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              aria-pressed={zoomed}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              {zoomed ? (
                <>
                  <ZoomOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Ajustar (1x)</span>
                </>
              ) : (
                <>
                  <ZoomIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Zoom (1.5x)</span>
                </>
              )}
            </button>

            <a
              href={activeModalImage.url}
              download={activeModalImage.name}
              aria-label="Descargar imagen"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar vista ampliada"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative flex-1 min-h-0 overflow-auto bg-white flex items-center justify-center p-2 sm:p-4">
          <img
            src={normalizarUrlImagen(activeModalImage.url)}
            alt={activeModalImage.name}
            referrerPolicy="no-referrer"
            onClick={() => setZoomed((z) => !z)}
            className={`cursor-zoom-in transition-all ${
              zoomed
                ? 'w-[150%] max-w-none h-auto cursor-zoom-out'
                : 'max-w-full max-h-[68dvh] w-auto h-auto object-contain'
            }`}
          />

          {isGallery && images.length > 1 && onSelectIndex && (
            <>
              <button
                type="button"
                onClick={() => onSelectIndex((activeIndex - 1 + images.length) % images.length)}
                aria-label="Figura anterior"
                className="fixed sm:absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full bg-slate-900/80 hover:bg-slate-900 text-white shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => onSelectIndex((activeIndex + 1) % images.length)}
                aria-label="Figura siguiente"
                className="fixed sm:absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full bg-slate-900/80 hover:bg-slate-900 text-white shadow-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {(activeModalImage.description || (isGallery && images.length > 1 && onSelectIndex)) && (
          <div className="px-4 py-3 border-t border-slate-800 bg-[#0F172A] space-y-2">
            {activeModalImage.description && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-[85ch]">
                {activeModalImage.description}
              </p>
            )}
            {isGallery && images.length > 1 && onSelectIndex && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectIndex((activeIndex - 1 + images.length) % images.length)}
                  className="min-h-[40px] inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {images.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectIndex(idx)}
                      aria-label={`Ir a figura ${idx + 1}`}
                      className={`min-h-[32px] min-w-[32px] rounded-md font-mono tabular-nums text-[11px] font-semibold transition-colors ${
                        idx === activeIndex
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onSelectIndex((activeIndex + 1) % images.length)}
                  className="min-h-[40px] inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface TheoryImageGalleryProps {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  images: CourseMaterial[];
  canManage: boolean;
  saving?: boolean;
  notice?: string | null;
  error?: string | null;
  onAddImages: (newImages: CourseMaterial[], successMessage: string) => Promise<void> | void;
  onUpdateImages: (nextImages: CourseMaterial[], successMessage: string) => Promise<void> | void;
}

type GalleryViewMode = 'stage' | 'grid';

export const TheoryImageGallery: React.FC<TheoryImageGalleryProps> = ({
  courseId,
  lessonId,
  lessonTitle,
  images,
  canManage,
  saving = false,
  notice = null,
  error = null,
  onAddImages,
  onUpdateImages,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [viewMode, setViewMode] = useState<GalleryViewMode>('stage');
  const [activeIndex, setActiveIndex] = useState(0);
  const [showComposer, setShowComposer] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);

  // Composer inputs
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [urlDriveConverted, setUrlDriveConverted] = useState(false);

  // Organize state (draft titles/descriptions + drag reorder + safe remove confirm)
  const [draftEdits, setDraftEdits] = useState<
    Record<string, { name: string; description: string }>
  >({});
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Image error tracking
  const [brokenIds, setBrokenIds] = useState<Record<string, boolean>>({});

  // Lightbox state (index inside `images`)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Reset per-lesson transient UI state
  useEffect(() => {
    setActiveIndex(0);
    setShowComposer(false);
    setIsOrganizing(false);
    setLocalError(null);
    setConfirmRemoveId(null);
    setLightboxIndex(null);
    setDraftEdits({});
  }, [lessonId]);

  // Keep activeIndex in bounds when images are added/deleted
  useEffect(() => {
    if (images.length === 0) {
      setActiveIndex(0);
      setLightboxIndex(null);
      return;
    }
    if (activeIndex >= images.length) {
      setActiveIndex(images.length - 1);
    }
    if (lightboxIndex !== null && lightboxIndex >= images.length) {
      setLightboxIndex(images.length - 1);
    }
  }, [images.length, activeIndex, lightboxIndex]);

  // Seed draftEdits when entering organize mode or when image list changes
  useEffect(() => {
    if (!isOrganizing) return;
    setDraftEdits((prev) => {
      const next: Record<string, { name: string; description: string }> = {};
      for (const img of images) {
        next[img.id] = prev[img.id] ?? {
          name: img.name,
          description: img.description ?? '',
        };
      }
      return next;
    });
  }, [isOrganizing, images]);

  // Nothing to render for students if lesson has 0 gallery images
  if (images.length === 0 && !canManage) {
    return null;
  }

  const activeImage = images[activeIndex] ?? null;
  const displayError = localError || error;
  const busy = saving || uploadingFiles;

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !canManage) return;
    setLocalError(null);
    setUploadingFiles(true);
    try {
      const uploaded: CourseMaterial[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setLocalError(`"${file.name}" no es una imagen válida (PNG, JPG, WebP o GIF).`);
          continue;
        }
        const mat = await uploadCourseMaterial(courseId || 'general', lessonId, file);
        const cleanTitle =
          files.length === 1 && titleInput.trim()
            ? titleInput.trim()
            : mat.name.replace(/\.[^.]+$/, '');
        uploaded.push({
          ...mat,
          name: cleanTitle,
          type: 'image',
          ...(descriptionInput.trim() ? { description: descriptionInput.trim() } : {}),
        });
      }
      if (uploaded.length > 0) {
        await onAddImages(
          uploaded,
          uploaded.length === 1
            ? 'Ilustración incorporada a la galería de teoría.'
            : `${uploaded.length} ilustraciones incorporadas a la galería.`
        );
        setActiveIndex(images.length);
        setTitleInput('');
        setDescriptionInput('');
        setShowComposer(false);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleUrlAttach = async () => {
    const rawUrl = urlInput.trim();
    if (!rawUrl) return;
    const normalizedUrl = normalizarUrlImagen(rawUrl);
    const isSafe =
      /^https?:\/\//i.test(normalizedUrl) ||
      normalizedUrl.startsWith('/') ||
      /^data:image\//i.test(normalizedUrl);
    if (!isSafe) {
      setLocalError('Ingresa una URL válida (https://... o /assets/...).');
      return;
    }
    setLocalError(null);
    const caption = titleInput.trim() || `Ilustración: ${lessonTitle}`;
    const mat: CourseMaterial = {
      ...buildExternalMaterial(caption, normalizedUrl, 'image', descriptionInput),
      id: `mat_img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
    };
    await onAddImages([mat], 'Ilustración vinculada correctamente a la galería.');
    setActiveIndex(images.length);
    setUrlInput('');
    setTitleInput('');
    setDescriptionInput('');
    setUrlDriveConverted(false);
    setShowComposer(false);
  };

  const handleAddPreset = async (preset: CatedraImagePreset) => {
    setLocalError(null);
    const alreadyExists = images.some((m) => m.url === preset.url);
    if (alreadyExists) {
      const idx = images.findIndex((m) => m.url === preset.url);
      if (idx >= 0) setActiveIndex(idx);
      setLocalError('Este diagrama técnico ya forma parte de la galería de esta lección.');
      return;
    }
    const mat: CourseMaterial = {
      id: `mat_img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
      name: preset.title,
      url: preset.url,
      type: 'image',
      description: preset.description,
      sizeByte: preset.sizeByte,
      uploadedAt: new Date().toISOString(),
    };
    await onAddImages([mat], `Diagrama "${preset.label}" añadido a la galería.`);
    setActiveIndex(images.length);
    setShowComposer(false);
  };

  const handleMoveImage = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const copy = [...images];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setActiveIndex(target);
    await onUpdateImages(copy, 'Orden de figuras actualizado.');
  };

  const handleDropReorder = async (sourceId: string, targetId: string) => {
    if (!sourceId || sourceId === targetId) return;
    const sourceIdx = images.findIndex((m) => m.id === sourceId);
    const targetIdx = images.findIndex((m) => m.id === targetId);
    if (sourceIdx < 0 || targetIdx < 0) return;
    const copy = [...images];
    const [moved] = copy.splice(sourceIdx, 1);
    copy.splice(targetIdx, 0, moved);
    setActiveIndex(targetIdx);
    await onUpdateImages(copy, 'Secuencia de la galería reordenada.');
  };

  const handleSaveMetadata = async (imgId: string) => {
    const draft = draftEdits[imgId];
    if (!draft) return;
    const cleanName = draft.name.trim();
    if (!cleanName) {
      setLocalError('Cada ilustración debe conservar un título técnico.');
      return;
    }
    setLocalError(null);
    const next = images.map((item) => {
      if (item.id !== imgId) return item;
      const cleanDesc = draft.description.trim();
      const updated: CourseMaterial = {
        ...item,
        name: cleanName,
      };
      if (cleanDesc) {
        updated.description = cleanDesc;
      } else {
        delete updated.description;
      }
      return updated;
    });
    await onUpdateImages(next, 'Descripción técnica actualizada.');
  };

  const handleDeleteImage = async (imgId: string) => {
    const next = images.filter((item) => item.id !== imgId);
    setConfirmRemoveId(null);
    await onUpdateImages(next, 'Ilustración retirada de la galería.');
  };

  const hasMetadataChanges = (img: CourseMaterial) => {
    const draft = draftEdits[img.id];
    if (!draft) return false;
    return (
      draft.name.trim() !== img.name.trim() ||
      draft.description.trim() !== (img.description ?? '').trim()
    );
  };

  return (
    <>
      {(images.length > 0 || canManage) && (
        <section
          aria-label="Galería visual de apoyo técnico"
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0B1222] overflow-hidden"
        >
          {/* Header toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 sm:px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0F172A]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-200/80 dark:border-blue-800/70 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-cyan-400">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {images.length === 0
                    ? 'Galería técnica de la lección'
                    : images.length === 1
                      ? 'Esquema técnico de apoyo'
                      : 'Galería técnica interactiva'}
                </h3>
                {images.length > 0 && (
                  <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {viewMode === 'stage'
                      ? `Figura ${String(activeIndex + 1).padStart(2, '0')} de ${String(images.length).padStart(2, '0')}`
                      : `${images.length} figuras disponibles`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {images.length > 1 && (
                <div
                  role="group"
                  aria-label="Modo de visualización de galería"
                  className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-0.5"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode('stage')}
                    aria-pressed={viewMode === 'stage'}
                    className={`min-h-[38px] inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      viewMode === 'stage'
                        ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-cyan-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Presentación</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-pressed={viewMode === 'grid'}
                    className={`min-h-[38px] inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-cyan-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Cuadrícula</span>
                  </button>
                </div>
              )}

              {canManage && images.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOrganizing((v) => !v);
                    setShowComposer(false);
                  }}
                  aria-expanded={isOrganizing}
                  className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isOrganizing
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-cyan-500/70 dark:bg-blue-950/50 dark:text-cyan-300'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-500'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{isOrganizing ? 'Listo' : 'Organizar'}</span>
                </button>
              )}

              {canManage && (
                <button
                  type="button"
                  onClick={() => {
                    setShowComposer((v) => !v);
                    setIsOrganizing(false);
                  }}
                  aria-expanded={showComposer}
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showComposer ? 'Cerrar' : 'Añadir imagen'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Feedback messages */}
          {(notice || displayError) && (
            <div className="px-3.5 sm:px-4 pt-3 space-y-2">
              {notice && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-800/70 bg-blue-50/70 dark:bg-blue-950/30 px-3 py-2 text-xs font-medium text-blue-800 dark:text-cyan-200">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>{notice}</span>
                </div>
              )}
              {displayError && (
                <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                  {displayError}
                </div>
              )}
            </div>
          )}

          {/* Instructor: Add image composer */}
          {canManage && showComposer && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void handleFileUpload(e.dataTransfer.files);
              }}
              className="m-3.5 sm:m-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Incorporar nueva ilustración con descripción técnica
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sube archivos PNG/JPG/WebP, arrástralos aquí o vincula una URL existente.
                  </p>
                </div>
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      void handleFileUpload(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[44px] inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
                  >
                    {busy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>{busy ? 'Guardando...' : 'Subir archivo(s)'}</span>
                  </button>
                </>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <div className="relative">
                    <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        setUrlDriveConverted(false);
                      }}
                      onBlur={(e) => {
                        const raw = e.target.value.trim();
                        if (raw && esGoogleDriveUrl(raw)) {
                          const normalized = normalizarUrlImagen(raw);
                          if (normalized !== raw) {
                            setUrlInput(normalized);
                            setUrlDriveConverted(true);
                          }
                        }
                      }}
                      placeholder="URL de imagen (https://... o /assets/...)"
                      className="w-full min-h-[44px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-8 pr-3 py-2 text-base sm:text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  {urlDriveConverted && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      ✅ Enlace de Google Drive convertido automáticamente
                    </p>
                  )}
                </div>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Título técnico (ej. Columnas, Filas y Celdas)"
                  className="w-full min-h-[44px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-base sm:text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2.5 items-end">
                <textarea
                  rows={2}
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="Descripción técnica que verá el estudiante junto a la figura (opcional)..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-base sm:text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  disabled={!urlInput.trim() || busy}
                  onClick={() => void handleUrlAttach()}
                  className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 px-4 py-2 text-xs font-semibold text-blue-700 dark:text-cyan-300 hover:bg-blue-100 dark:hover:bg-blue-950/70 disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Vincular URL</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1">
                  Diagramas Cátedra listos:
                </span>
                {CATEDRA_GALLERY_PRESETS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    disabled={busy}
                    onClick={() => void handleAddPreset(preset)}
                    className="min-h-[36px] rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-cyan-300 transition-colors disabled:opacity-40"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Instructor: Organize / Reorder / Edit technical descriptions */}
          {canManage && isOrganizing && images.length > 0 && (
            <div className="m-3.5 sm:m-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] p-3.5 sm:p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Organizar secuencia y descripciones técnicas
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Arrastra las tarjetas o usa las flechas para cambiar el orden visible para el alumno.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {images.map((img, idx) => {
                  const draft = draftEdits[img.id] ?? {
                    name: img.name,
                    description: img.description ?? '',
                  };
                  const dirty = hasMetadataChanges(img);
                  const isConfirming = confirmRemoveId === img.id;
                  return (
                    <div
                      key={img.id}
                      draggable
                      onDragStart={() => setDraggingId(img.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggingId) {
                          void handleDropReorder(draggingId, img.id);
                          setDraggingId(null);
                        }
                      }}
                      onDragEnd={() => setDraggingId(null)}
                      className={`grid grid-cols-1 md:grid-cols-[112px_1fr_auto] gap-3 items-start rounded-xl border p-3 transition-colors ${
                        draggingId === img.id
                          ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 opacity-75'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 md:block">
                        <div className="relative aspect-video w-28 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white shrink-0">
                          <img
                            src={normalizarUrlImagen(img.url)}
                            alt={img.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                          <span className="absolute top-1 left-1 rounded bg-slate-900/80 px-1.5 py-0.5 font-mono tabular-nums text-[10px] font-semibold text-white">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <span className="md:hidden text-xs font-mono text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                          <GripVertical className="w-3.5 h-3.5" />
                          Arrastrable
                        </span>
                      </div>

                      <div className="min-w-0 space-y-2">
                        <input
                          type="text"
                          value={draft.name}
                          onChange={(e) =>
                            setDraftEdits((prev) => ({
                              ...prev,
                              [img.id]: { ...draft, name: e.target.value },
                            }))
                          }
                          aria-label={`Título técnico de figura ${idx + 1}`}
                          placeholder="Título técnico de la figura"
                          className="w-full min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-base sm:text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <textarea
                          rows={2}
                          value={draft.description}
                          onChange={(e) =>
                            setDraftEdits((prev) => ({
                              ...prev,
                              [img.id]: { ...draft, description: e.target.value },
                            }))
                          }
                          aria-label={`Descripción técnica de figura ${idx + 1}`}
                          placeholder="Explicación técnica para el estudiante (qué observar en esta figura)..."
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-base sm:text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="flex flex-wrap md:flex-col items-center md:items-end justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0 || busy}
                            onClick={() => void handleMoveImage(idx, -1)}
                            title="Mover antes"
                            aria-label="Mover figura antes"
                            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-500 disabled:opacity-35"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === images.length - 1 || busy}
                            onClick={() => void handleMoveImage(idx, 1)}
                            title="Mover después"
                            aria-label="Mover figura después"
                            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-500 disabled:opacity-35"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {dirty && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleSaveMetadata(img.id)}
                              className="min-h-[40px] inline-flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Guardar</span>
                            </button>
                          )}
                          {isConfirming ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleDeleteImage(img.id)}
                                className="min-h-[40px] rounded-lg bg-red-600 hover:bg-red-700 px-2.5 py-1.5 text-xs font-semibold text-white"
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmRemoveId(null)}
                                className="min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setConfirmRemoveId(img.id)}
                              aria-label={`Quitar ${img.name}`}
                              className="min-h-[40px] inline-flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-900/60 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Quitar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state (only visible to instructors when no images exist yet) */}
          {images.length === 0 && canManage && !showComposer && (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              Esta lección aún no tiene diagramas visuales vinculados. Pulsa <strong className="text-slate-700 dark:text-slate-200">Añadir imagen</strong> para adjuntar o crear una galería técnica.
            </div>
          )}

          {/* Student Visualization Mode 1: Interactive Stage + Thumbnail Strip */}
          {images.length > 0 && viewMode === 'stage' && activeImage && (
            <div className="min-w-0">
              <div className="relative bg-white dark:bg-slate-950/90">
                {brokenIds[activeImage.id] ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-14 px-4 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                    <ImageIcon className="w-7 h-7 opacity-70" />
                    <p className="text-xs font-medium text-center">{activeImage.name}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(activeIndex)}
                    aria-label={`Ampliar figura ${activeIndex + 1}: ${activeImage.name}`}
                    className="group relative block w-full text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600"
                  >
                    <img
                      src={normalizarUrlImagen(activeImage.url)}
                      alt={activeImage.name}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenIds((prev) => ({ ...prev, [activeImage.id]: true }))
                      }
                      className="w-full h-auto max-h-[520px] object-contain mx-auto block"
                    />
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900/85 px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-95 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity absolute bottom-3 right-3 shadow-sm">
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Inspeccionar figura</span>
                    </span>
                  </button>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveIndex((prev) => (prev - 1 + images.length) % images.length)
                      }
                      aria-label="Figura anterior"
                      className="hidden sm:inline-flex items-center justify-center w-11 h-11 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white shadow-md backdrop-blur-sm transition-colors absolute left-3 top-1/2 -translate-y-1/2"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveIndex((prev) => (prev + 1) % images.length)}
                      aria-label="Figura siguiente"
                      className="hidden sm:inline-flex items-center justify-center w-11 h-11 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white shadow-md backdrop-blur-sm transition-colors absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Caption + technical description */}
              <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] space-y-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-[11px] font-semibold text-blue-600 dark:text-cyan-400">
                        FIG. {String(activeIndex + 1).padStart(2, '0')}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                        {activeImage.name}
                      </h4>
                    </div>
                    {activeImage.description && (
                      <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-300 max-w-[75ch]">
                        {activeImage.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {images.length > 1 && (
                      <div className="flex sm:hidden items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveIndex((prev) => (prev - 1 + images.length) % images.length)
                          }
                          aria-label="Figura anterior"
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveIndex((prev) => (prev + 1) % images.length)}
                          aria-label="Figura siguiente"
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {!brokenIds[activeImage.id] && (
                      <button
                        type="button"
                        onClick={() => setLightboxIndex(activeIndex)}
                        className="min-h-[44px] inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800/80 bg-blue-50/60 dark:bg-blue-950/40 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-cyan-300 hover:bg-blue-100 dark:hover:bg-blue-950/70 transition-colors"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Ampliar</span>
                      </button>
                    )}

                    <a
                      href={activeImage.url}
                      download={activeImage.name}
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-cyan-300 transition-colors"
                      title="Descargar diagrama"
                      aria-label={`Descargar ${activeImage.name}`}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Interactive thumbnail strip for multi-image lessons */}
              {images.length > 1 && (
                <div
                  role="tablist"
                  aria-label="Miniaturas de la galería técnica"
                  className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#070E1D]"
                >
                  {images.map((img, idx) => {
                    const isSelected = idx === activeIndex;
                    return (
                      <button
                        key={img.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setActiveIndex(idx)}
                        className={`snap-start shrink-0 w-36 sm:w-44 min-h-[44px] rounded-lg border text-left overflow-hidden transition-all ${
                          isSelected
                            ? 'border-blue-600 dark:border-cyan-400 ring-1 ring-blue-600/30 dark:ring-cyan-400/30 bg-white dark:bg-[#111827]'
                            : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 opacity-80 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="relative h-16 w-full bg-white border-b border-slate-200/80 dark:border-slate-800 overflow-hidden">
                          {brokenIds[img.id] ? (
                            <div className="flex h-full items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-400">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          ) : (
                            <img
                              src={normalizarUrlImagen(img.url)}
                              alt=""
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain"
                            />
                          )}
                          <span
                            className={`absolute top-1 left-1 rounded px-1.5 py-0.5 font-mono tabular-nums text-[10px] font-bold ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-900/75 text-white'
                            }`}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <p className="px-2 py-1.5 text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate">
                          {img.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Student Visualization Mode 2: Comparison Grid */}
          {images.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 sm:p-4">
              {images.map((img, idx) => {
                const isBroken = Boolean(brokenIds[img.id]);
                return (
                  <figure
                    key={img.id}
                    className="min-w-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden flex flex-col"
                  >
                    {isBroken ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                        <ImageIcon className="w-6 h-6 opacity-70" />
                        <p className="text-xs font-medium text-center">{img.name}</p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveIndex(idx);
                          setLightboxIndex(idx);
                        }}
                        aria-label={`Ampliar figura ${idx + 1}: ${img.name}`}
                        className="group relative block w-full aspect-[16/10] bg-white text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 border-b border-slate-200 dark:border-slate-800"
                      >
                        <img
                          src={normalizarUrlImagen(img.url)}
                          alt={img.name}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setBrokenIds((prev) => ({ ...prev, [img.id]: true }))
                          }
                          className="w-full h-full object-contain mx-auto block"
                        />
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900/85 px-2 py-1 text-[11px] font-semibold text-white opacity-95 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity absolute bottom-2 right-2">
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>Ampliar</span>
                        </span>
                      </button>
                    )}

                    <figcaption className="flex-1 flex flex-col justify-between gap-2.5 p-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono tabular-nums text-[11px] font-semibold text-blue-600 dark:text-cyan-400">
                            FIG. {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                            {img.name}
                          </span>
                        </div>
                        {img.description && (
                          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                            {img.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveIndex(idx);
                            setViewMode('stage');
                          }}
                          className="min-h-[38px] text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300"
                        >
                          Ver en presentación
                        </button>
                        {!isBroken && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveIndex(idx);
                              setLightboxIndex(idx);
                            }}
                            className="min-h-[38px] inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-cyan-300 hover:bg-blue-50 dark:hover:bg-slate-800"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>Ampliar</span>
                          </button>
                        )}
                      </div>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          )}
        </section>
      )}

      {lightboxIndex !== null && (
        <ImageLightboxModal
          images={images}
          activeIndex={lightboxIndex}
          onSelectIndex={(nextIdx) => {
            setLightboxIndex(nextIdx);
            setActiveIndex(nextIdx);
          }}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
};
