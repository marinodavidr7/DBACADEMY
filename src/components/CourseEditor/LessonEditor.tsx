import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FileSpreadsheet,
  HelpCircle,
  Image as ImageIcon,
  Link2,
  Loader2,
  MonitorPlay,
  Plus,
  Trash2,
  Type,
  UploadCloud,
  Video,
} from 'lucide-react';
import type { CourseLesson, CourseLessonType, CourseMaterial, LessonAssignmentConfig } from '../../types';
import {
  buildExternalMaterial,
  uploadCourseMaterial,
} from '../../services/storageService';
import { extractYouTubeId, newId } from '../../utils/courseEditor';
import { esGoogleDriveUrl, normalizarUrlImagen } from '../../utils/imageUtils';
import { Field } from './Field';
import { MarkdownEditor } from './MarkdownEditor';
import { hasMeaningfulContent } from '../../utils/richText';
import { MaterialsPanel } from './MaterialsPanel';

interface LessonEditorProps {
  lesson: CourseLesson;
  moduleTitle: string;
  lessonLabel: string;
  onChange: (patch: Partial<CourseLesson>) => void;
  onDelete: () => void;
  onPreview: () => void;
  courseId: string;
  canEdit: boolean;
  labels: {
    title: string;
    titlePlaceholder: string;
    type: string;
    typeText: string;
    typeVideo: string;
    typeExcel: string;
    typeQuiz: string;
    duration: string;
    status: string;
    statusDraft: string;
    statusPublished: string;
    summary: string;
    summaryPlaceholder: string;
    content: string;
    contentPlaceholder: string;
    editTab: string;
    previewTab: string;
    markdownTitle: string;
    previewEmpty: string;
    bold: string;
    italic: string;
    list: string;
    code: string;
    formula: string;
    link: string;
    videoUrl: string;
    videoUrlPlaceholder: string;
    videoInvalid: string;
    videoPreview: string;
    videoAllowSeeking: string;
    videoRequiredWatchPercent: string;
    videoAllowSpeedChange: string;
    videoTodo: string;
    excelTodo: string;
    quizTodo: string;
    materials: {
      title: string;
      empty: string;
      emptyHint: string;
      dropCompact: string;
      tooLarge: string;
      unsupported: string;
      uploading: string;
      rename: string;
      download: string;
      delete: string;
      renameTitle: string;
      renameAction: string;
      renameCancel: string;
    };
  };
}

const LESSON_TYPES: Array<{
  value: CourseLessonType;
  labelKey: 'typeText' | 'typeVideo' | 'typeExcel' | 'typeQuiz';
  icon: React.ReactNode;
}> = [
  { value: 'text', labelKey: 'typeText', icon: <Type className="h-4 w-4" /> },
  { value: 'video', labelKey: 'typeVideo', icon: <Video className="h-4 w-4" /> },
  { value: 'excel', labelKey: 'typeExcel', icon: <FileSpreadsheet className="h-4 w-4" /> },
  { value: 'quiz', labelKey: 'typeQuiz', icon: <HelpCircle className="h-4 w-4" /> },
];

export const LessonEditor: React.FC<LessonEditorProps> = memo(({
  lesson,
  moduleTitle,
  lessonLabel,
  onChange,
  onDelete,
  onPreview,
  courseId,
  canEdit,
  labels,
}) => {
  const videoId = extractYouTubeId(lesson.videoUrl ?? '');
  const [showVideoInput, setShowVideoInput] = useState(Boolean(lesson.videoUrl));
  const theoryImageInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingTheoryImages, setUploadingTheoryImages] = useState(false);
  const [theoryImageError, setTheoryImageError] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageCaptionInput, setImageCaptionInput] = useState('');
  const [imageDescriptionInput, setImageDescriptionInput] = useState('');
  const [imageUrlDriveConverted, setImageUrlDriveConverted] = useState(false);

  const allMaterials = lesson.materials ?? [];
  const theoryImages = useMemo(
    () => allMaterials.filter((m) => m.type === 'image'),
    [allMaterials]
  );
  const otherMaterials = useMemo(
    () => allMaterials.filter((m) => m.type !== 'image'),
    [allMaterials]
  );

  const updateTheoryImages = useCallback(
    (nextImages: CourseMaterial[]) => {
      onChange({ materials: [...nextImages, ...otherMaterials] });
    },
    [onChange, otherMaterials]
  );

  const handleContentChange = useCallback(
    (content: string) => onChange({ content }),
    [onChange]
  );

  const handleMaterialsChange = useCallback(
    (materials: CourseMaterial[]) => onChange({ materials }),
    [onChange]
  );

  const handleTheoryImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !canEdit) return;
    setTheoryImageError(null);
    setUploadingTheoryImages(true);
    try {
      const uploaded: CourseMaterial[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setTheoryImageError(`"${file.name}" no es un archivo de imagen válido (PNG, JPG, WebP, GIF).`);
          continue;
        }
        const mat = await uploadCourseMaterial(courseId || 'general', lesson.id, file);
        uploaded.push({ ...mat, type: 'image' });
      }
      if (uploaded.length > 0) {
        updateTheoryImages([...theoryImages, ...uploaded]);
      }
    } catch (err) {
      setTheoryImageError(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
    } finally {
      setUploadingTheoryImages(false);
    }
  };

  const handleAddTheoryImageUrl = () => {
    const trimmedUrl = imageUrlInput.trim();
    if (!trimmedUrl) return;
    const normalizedUrl = normalizarUrlImagen(trimmedUrl);
    const isAllowedUrl =
      /^https?:\/\//i.test(normalizedUrl) ||
      normalizedUrl.startsWith('/') ||
      /^data:image\//i.test(normalizedUrl);
    if (!isAllowedUrl) {
      setTheoryImageError('Ingresa una URL válida (https://... o /assets/...).');
      return;
    }
    setTheoryImageError(null);
    const caption = imageCaptionInput.trim() || `Ilustración de ${lesson.title || 'la lección'}`;
    const mat: CourseMaterial = {
      ...buildExternalMaterial(caption, normalizedUrl, 'image', imageDescriptionInput),
      id: newId('mat_img'),
    };
    updateTheoryImages([...theoryImages, mat]);
    setImageUrlInput('');
    setImageCaptionInput('');
    setImageDescriptionInput('');
    setImageUrlDriveConverted(false);
  };

  const moveTheoryImage = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= theoryImages.length) return;
    const copy = [...theoryImages];
    const [moved] = copy.splice(idx, 1);
    copy.splice(target, 0, moved);
    updateTheoryImages(copy);
  };

  const typeLabel = (() => {
    if (lesson.type === 'video') return labels.typeVideo;
    if (lesson.type === 'excel') return labels.typeExcel;
    if (lesson.type === 'quiz') return labels.typeQuiz;
    return labels.typeText;
  })();

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              {lessonLabel} · {moduleTitle}
            </span>
            <input
              value={lesson.title}
              onChange={(event) => onChange({ title: event.target.value })}
              placeholder={labels.titlePlaceholder}
              aria-label={labels.title}
              className="mt-1 w-full border-0 border-b-2 border-transparent bg-transparent px-0 text-2xl font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <MonitorPlay className="h-4 w-4" />
              {labels.previewTab}
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/60 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              {labels.materials.delete}
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label={labels.type}>
            <div className="grid grid-cols-2 gap-1.5">
              {LESSON_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => onChange({ type: type.value })}
                  aria-pressed={lesson.type === type.value}
                  className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium ${
                    lesson.type === type.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {type.icon}
                  {labels[type.labelKey]}
                </button>
              ))}
            </div>
          </Field>
          <Field label={labels.duration}>
            <input
              type="number"
              min={1}
              max={240}
              value={lesson.durationMinutes}
              onChange={(event) => onChange({ durationMinutes: Math.max(1, Number(event.target.value) || 1) })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm tabular-nums"
            />
          </Field>
          <Field label={labels.status}>
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
              {(['draft', 'published'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => onChange({ status })}
                  aria-pressed={lesson.status === status}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium ${
                    lesson.status === status
                      ? status === 'published'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {status === 'published' ? labels.statusPublished : labels.statusDraft}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <Field
          label={labels.summary}
          help={`${lesson.summary.length}/240`}
        >
          <textarea
            rows={2}
            maxLength={240}
            value={lesson.summary}
            onChange={(event) => onChange({ summary: event.target.value })}
            placeholder={labels.summaryPlaceholder}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
        </Field>
      </div>

      {(lesson.type === 'video' || Boolean(lesson.videoUrl) || showVideoInput) && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-red-500/10 text-red-500 flex items-center justify-center">
                <Video className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {labels.videoUrl}
              </span>
            </div>
            {lesson.type !== 'video' && (
              <button
                type="button"
                onClick={() => {
                  onChange({ videoUrl: undefined });
                  setShowVideoInput(false);
                }}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                Quitar video
              </button>
            )}
          </div>

          <Field
            label=""
            error={lesson.videoUrl && !videoId ? labels.videoInvalid : undefined}
            help={labels.videoTodo}
          >
            <input
              type="url"
              value={lesson.videoUrl ?? ''}
              onChange={(event) => onChange({ videoUrl: event.target.value })}
              placeholder={labels.videoUrlPlaceholder}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </Field>

          {videoId ? (
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`}
                title={labels.videoPreview}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-sm text-slate-400">
              {lesson.videoUrl ? labels.videoInvalid : labels.videoPreview}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={lesson.allowSeeking ?? true}
                onChange={(event) => onChange({ allowSeeking: event.target.checked })}
                className="h-4 w-4 rounded accent-blue-600"
              />
              {labels.videoAllowSeeking}
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={lesson.allowSpeedChange ?? true}
                onChange={(event) => onChange({ allowSpeedChange: event.target.checked })}
                className="h-4 w-4 rounded accent-blue-600"
              />
              {labels.videoAllowSpeedChange}
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <span className="shrink-0">{labels.videoRequiredWatchPercent}</span>
              <input
                type="number"
                min={0}
                max={100}
                value={lesson.requiredWatchPercent ?? 80}
                onChange={(event) =>
                  onChange({ requiredWatchPercent: Math.max(0, Math.min(100, Number(event.target.value) || 0)) })
                }
                className="w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm tabular-nums"
              />
            </label>
          </div>
        </div>
      )}

      {lesson.type !== 'video' && !lesson.videoUrl && !showVideoInput && (
        <button
          type="button"
          onClick={() => setShowVideoInput(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 py-2.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/20 transition-colors"
        >
          <Video className="w-4 h-4 text-red-500" />
          <span>+ Vincular video explicativo a esta lección (YouTube / Vimeo)</span>
        </button>
      )}

      {lesson.type === 'excel' && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-sm text-emerald-800 dark:text-emerald-200">
          <div className="flex items-start gap-2">
            <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{labels.excelTodo}</span>
          </div>
        </div>
      )}

      {lesson.type === 'quiz' && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 p-4 text-sm text-blue-800 dark:text-blue-200">
          <div className="flex items-start gap-2">
            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{labels.quizTodo}</span>
          </div>
        </div>
      )}

      <MarkdownEditor
        id={`content-${lesson.id}`}
        label={lesson.type === 'video' ? `${labels.content} (Notas y apuntes opcionales)` : labels.content}
        value={lesson.content}
        onChange={handleContentChange}
        placeholder={lesson.type === 'video' ? 'Agrega apuntes o resumen de la lección...' : labels.contentPlaceholder}
        editLabel={labels.editTab}
        previewLabel={labels.previewTab}
        previewEmpty={labels.previewEmpty}
        boldLabel={labels.bold}
        italicLabel={labels.italic}
        listLabel={labels.list}
        codeLabel={labels.code}
        formulaLabel={labels.formula}
        linkLabel={labels.link}
        courseId={courseId || 'general'}
        lessonId={lesson.id}
        canEdit={canEdit}
      />

      {!hasMeaningfulContent(lesson.content) && lesson.type !== 'video' && !lesson.videoUrl && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {labels.contentPlaceholder}
        </div>
      )}

      {theoryImages.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 px-4 py-3 text-xs text-amber-900 dark:text-amber-200">
          <p className="font-semibold">Galería heredada de ilustraciones</p>
          <p className="mt-0.5 text-amber-800/90 dark:text-amber-300/90">
            Esta lección tiene {theoryImages.length} imagen(es) en la galería antigua. Inserta imágenes nuevas directamente en el editor de contenido (botón Imagen) para que aparezcan en el lugar exacto del texto. Las imágenes heredadas siguen visibles como anexos para el estudiante y puedes gestionarlas en Materiales.
          </p>
        </div>
      )}

      <MaterialsPanel
        courseId={courseId}
        lessonId={lesson.id}
        lessonTitle={lesson.title}
        materials={allMaterials}
        canEdit={canEdit}
        onChange={handleMaterialsChange}
        labels={labels.materials}
      />

      {/* Assignment config */}
      {canEdit && (
        <section className="rounded-xl border border-indigo-200/60 dark:border-indigo-800/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">📋 Tarea de la lección</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Activa una tarea para que los estudiantes puedan subir un archivo.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onChange({
                  assignmentConfig: {
                    ...(lesson.assignmentConfig ?? {}),
                    enabled: !lesson.assignmentConfig?.enabled,
                    title: lesson.assignmentConfig?.title ?? '',
                    instructions: lesson.assignmentConfig?.instructions ?? '',
                    maxScore: lesson.assignmentConfig?.maxScore ?? 100,
                    allowedFileTypes: lesson.assignmentConfig?.allowedFileTypes ?? '.xlsx,.pdf,.docx,.zip',
                  } as LessonAssignmentConfig,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                lesson.assignmentConfig?.enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  lesson.assignmentConfig?.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {lesson.assignmentConfig?.enabled && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Título de la tarea
                </label>
                <input
                  type="text"
                  value={lesson.assignmentConfig.title ?? ''}
                  onChange={(e) =>
                    onChange({ assignmentConfig: { ...lesson.assignmentConfig!, title: e.target.value } })
                  }
                  placeholder="Ej: Práctica de fórmulas Excel"
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Instrucciones
                </label>
                <textarea
                  value={lesson.assignmentConfig.instructions ?? ''}
                  onChange={(e) =>
                    onChange({ assignmentConfig: { ...lesson.assignmentConfig!, instructions: e.target.value } })
                  }
                  rows={3}
                  placeholder="Describe qué debe hacer el estudiante..."
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Fecha límite (opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={lesson.assignmentConfig.dueDate ?? ''}
                    onChange={(e) =>
                      onChange({ assignmentConfig: { ...lesson.assignmentConfig!, dueDate: e.target.value } })
                    }
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Puntuación máxima
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={lesson.assignmentConfig.maxScore ?? 100}
                    onChange={(e) =>
                      onChange({ assignmentConfig: { ...lesson.assignmentConfig!, maxScore: Number(e.target.value) } })
                    }
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Tipos de archivo permitidos
                </label>
                <input
                  type="text"
                  value={
                    Array.isArray(lesson.assignmentConfig.allowedFileTypes)
                      ? lesson.assignmentConfig.allowedFileTypes.join(',')
                      : (lesson.assignmentConfig.allowedFileTypes ?? '.xlsx,.pdf,.docx,.zip')
                  }
                  onChange={(e) =>
                    onChange({ assignmentConfig: { ...lesson.assignmentConfig!, allowedFileTypes: e.target.value } })
                  }
                  placeholder=".xlsx,.pdf,.docx,.zip"
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-400 mt-1">Separados por coma, ej: .xlsx,.pdf,.docx,.zip</p>
              </div>
            </div>
          )}
        </section>
      )}

      <div className="hidden">{typeLabel}</div>
    </div>
  );
});
