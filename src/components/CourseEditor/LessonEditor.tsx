import React, { useRef, useState } from 'react';
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
import type { CourseLesson, CourseLessonType, CourseMaterial } from '../../types';
import {
  buildExternalMaterial,
  uploadCourseMaterial,
} from '../../services/storageService';
import { extractYouTubeId, newId } from '../../utils/courseEditor';
import { Field } from './Field';
import { MarkdownEditor } from './MarkdownEditor';
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

export const LessonEditor: React.FC<LessonEditorProps> = ({
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
  const theoryImageInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingTheoryImages, setUploadingTheoryImages] = useState(false);
  const [theoryImageError, setTheoryImageError] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageCaptionInput, setImageCaptionInput] = useState('');
  const [imageDescriptionInput, setImageDescriptionInput] = useState('');

  const allMaterials = lesson.materials ?? [];
  const theoryImages = allMaterials.filter((m) => m.type === 'image');
  const otherMaterials = allMaterials.filter((m) => m.type !== 'image');

  const updateTheoryImages = (nextImages: CourseMaterial[]) => {
    onChange({ materials: [...nextImages, ...otherMaterials] });
  };

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
    const isAllowedUrl =
      /^https?:\/\//i.test(trimmedUrl) ||
      trimmedUrl.startsWith('/') ||
      /^data:image\//i.test(trimmedUrl);
    if (!isAllowedUrl) {
      setTheoryImageError('Ingresa una URL válida (https://... o /assets/...).');
      return;
    }
    setTheoryImageError(null);
    const caption = imageCaptionInput.trim() || `Ilustración de ${lesson.title || 'la lección'}`;
    const mat: CourseMaterial = {
      ...buildExternalMaterial(caption, trimmedUrl, 'image', imageDescriptionInput),
      id: newId('mat_img'),
    };
    updateTheoryImages([...theoryImages, mat]);
    setImageUrlInput('');
    setImageCaptionInput('');
    setImageDescriptionInput('');
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

      {lesson.type === 'video' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] p-5 space-y-4">
          <Field
            label={labels.videoUrl}
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
                src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                title={labels.videoPreview}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
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

      {lesson.type !== 'video' && (
        <MarkdownEditor
          id={`content-${lesson.id}`}
          label={labels.content}
          value={lesson.content}
          onChange={(value) => onChange({ content: value })}
          placeholder={labels.contentPlaceholder}
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
      )}

      {!lesson.content.trim() && lesson.type !== 'video' && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {labels.contentPlaceholder}
        </div>
      )}

      {/* Imágenes visibles dentro de la pestaña Teoría — estilo Cátedra */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-cyan-400 border border-blue-200/70 dark:border-blue-800/60">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Ilustraciones de la Teoría
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Diagramas técnicos (columnas, filas, celdas, flujos) visibles directamente en el visor de teoría.
              </p>
            </div>
          </div>

          {canEdit && (
            <>
              <input
                ref={theoryImageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  void handleTheoryImageUpload(event.target.files);
                  event.target.value = '';
                }}
              />
              <button
                type="button"
                disabled={uploadingTheoryImages}
                onClick={() => theoryImageInputRef.current?.click()}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
              >
                {uploadingTheoryImages ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="h-3.5 w-3.5" />
                )}
                <span>{uploadingTheoryImages ? 'Subiendo...' : 'Subir imagen(es)'}</span>
              </button>
            </>
          )}
        </div>

        {theoryImageError && (
          <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-700 dark:text-red-300">
            {theoryImageError}
          </div>
        )}

        {canEdit && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
              <div className="relative">
                <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Vincular URL (https://... o /assets/...)"
                  className="w-full min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-8 pr-3 py-1.5 text-base sm:text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <input
                type="text"
                value={imageCaptionInput}
                onChange={(e) => setImageCaptionInput(e.target.value)}
                placeholder="Título técnico de la figura"
                className="w-full min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-base sm:text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="button"
                disabled={!imageUrlInput.trim()}
                onClick={handleAddTheoryImageUrl}
                className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/30 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-cyan-300 hover:bg-blue-100 dark:hover:bg-blue-950/60 disabled:opacity-40 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Vincular URL</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={imageDescriptionInput}
              onChange={(e) => setImageDescriptionInput(e.target.value)}
              placeholder="Descripción técnica para el estudiante (opcional)..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-base sm:text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        )}

        {theoryImages.length === 0 ? (
          <div
            onDragOver={(e) => {
              if (!canEdit) return;
              e.preventDefault();
            }}
            onDrop={(e) => {
              if (!canEdit) return;
              e.preventDefault();
              void handleTheoryImageUpload(e.dataTransfer.files);
            }}
            className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 px-3 py-5 text-center text-xs text-slate-500 dark:text-slate-400"
          >
            No hay ilustraciones vinculadas. Arrastra una imagen aquí, súbela desde tu equipo o pega una URL arriba.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {theoryImages.map((img, idx) => (
              <div
                key={img.id}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900 overflow-hidden flex flex-col"
              >
                <div className="aspect-video bg-white dark:bg-slate-950 overflow-hidden border-b border-slate-200 dark:border-slate-800">
                  <img
                    src={img.url}
                    alt={img.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="p-2.5 space-y-2">
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={img.name}
                    onChange={(e) => {
                      const next = theoryImages.map((item) =>
                        item.id === img.id ? { ...item, name: e.target.value } : item
                      );
                      updateTheoryImages(next);
                    }}
                    aria-label="Título o pie de foto de la imagen"
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-base sm:text-xs font-medium text-slate-800 dark:text-slate-100"
                  />
                  <textarea
                    rows={2}
                    disabled={!canEdit}
                    value={img.description ?? ''}
                    onChange={(e) => {
                      const next = theoryImages.map((item) =>
                        item.id === img.id ? { ...item, description: e.target.value } : item
                      );
                      updateTheoryImages(next);
                    }}
                    placeholder="Descripción técnica de la figura para la galería del estudiante..."
                    aria-label="Descripción técnica de la imagen"
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-base sm:text-xs text-slate-700 dark:text-slate-200"
                  />
                  {canEdit && (
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveTheoryImage(idx, -1)}
                          title="Mover antes"
                          className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === theoryImages.length - 1}
                          onClick={() => moveTheoryImage(idx, 1)}
                          title="Mover después"
                          className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateTheoryImages(theoryImages.filter((item) => item.id !== img.id))
                        }
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Quitar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <MaterialsPanel
        courseId={courseId}
        lessonId={lesson.id}
        lessonTitle={lesson.title}
        materials={lesson.materials ?? []}
        canEdit={canEdit}
        onChange={(materials: CourseMaterial[]) => onChange({ materials })}
        labels={labels.materials}
      />

      <div className="hidden">{typeLabel}</div>
    </div>
  );
};
