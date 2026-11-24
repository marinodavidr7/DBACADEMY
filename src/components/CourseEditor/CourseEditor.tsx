import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Course, CourseLesson, CourseModule, CourseSyncStatus } from '../../types';
import { usePlatform } from '../../context/PlatformContext';
import type { TranslationKeys } from '../../i18n/translations';
import { uploadCourseCoverImage } from '../../services/storageService';
import { isAuthorizedAdminEmail } from '../../firebase';
import {
  cloneModules,
  collectPublishIssues,
  createEmptyLesson,
  createEmptyModule,
  newId,
  reorderLessons,
  reorderModules,
} from '../../utils/courseEditor';
import { ConfirmDialog } from './ConfirmDialog';
import { CourseIndex } from './CourseIndex';
import { LessonEditor } from './LessonEditor';
import { QuizBuilder } from './QuizBuilder';
import { ToastStack, type ToastItem } from './Toast';
import { StudentPreviewModal } from './StudentPreviewModal';

const COVER_PRESETS = [
  { label: 'Excel / Productividad', url: '/assets/images/course_excel_basico_1795186770853.webp' },
  { label: 'Ingeniería', url: '/assets/images/course_system_architecture_1795146988857.webp' },
  { label: 'Datos', url: '/assets/images/course_data_science_1795146987818.webp' },
  { label: 'Diseño', url: '/assets/images/course_ux_engineering_1795146988343.webp' },
  { label: 'Seguridad', url: '/assets/images/course_cybersecurity_e2ee_1795146988090.webp' },
];

interface CourseEditorProps {
  course: Course | null;
  onCancel: () => void;
  onCreate: (input: CourseInput, syncOptions?: { targetRevision?: number }) => Promise<Course | void>;
  onUpdate: (courseId: string, patch: CourseInput, syncOptions?: { targetRevision?: number }) => Promise<void>;
  labels?: CourseEditorLabels;
  t?: (key: TranslationKeys) => string;
}

export type CourseEditorInput = CourseInput;

export interface CourseInput {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: Course['level'];
  priceCents: number;
  currency: Course['currency'];
  coverImage: string;
  published: boolean;
  modulesCount: number;
  totalLessons: number;
  modules: CourseModule[];
}

export interface CourseEditorLabels {
  index: {
    title: string;
    subtitle: string;
    addModule: string;
    addLesson: string;
    module: string;
    lesson: string;
    draft: string;
    published: string;
    incomplete: string;
    emptyModule: string;
    emptyModuleAction: string;
    moduleCount: string;
    lessonCount: string;
    materialCount: string;
    moveModuleUp: string;
    moveModuleDown: string;
    moveLessonUp: string;
    moveLessonDown: string;
    deleteModule: string;
    deleteLesson: string;
    dragHandle: string;
  };
  lesson: {
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
  quiz: {
    title: string;
    enabled: string;
    addQuestion: string;
    question: string;
    prompt: string;
    explanation: string;
    explanationPlaceholder: string;
    multiple: string;
    addOption: string;
    removeOption: string;
    correct: string;
    moveUp: string;
    moveDown: string;
    removeQuestion: string;
    optionLabel: string;
    minOptions: string;
    oneCorrect: string;
    multipleCorrect: string;
    emptyPrompt: string;
    emptyOption: string;
  };
  actions: {
    save: string;
    saved: string;
    savedAgo: string;
    saving: string;
    unsaved: string;
    saveError: string;
    retry: string;
    previewStudent: string;
    publish: string;
    unpublish: string;
    publishCheckTitle: string;
    publishCheckHint: string;
    issueLessonEmpty: string;
    issueModuleNoQuiz: string;
    issueQuizInvalid: string;
    deleteModule: string;
    deleteLesson: string;
    deleteMaterial: string;
    confirmDeleteModuleTitle: string;
    confirmDeleteModuleBody: string;
    confirmDeleteLessonTitle: string;
    confirmDeleteLessonBody: string;
    confirmDeleteMaterialTitle: string;
    confirmDeleteMaterialBody: string;
    confirmAccept: string;
    confirmCancel: string;
    undo: string;
    deletedModule: string;
    deletedLesson: string;
    deletedMaterial: string;
    selectPrompt: string;
    selectModulePrompt: string;
    autosaveHint: string;
    unsavedWarning: string;
    courseHeader: string;
    courseDetails: string;
    coverSelector: string;
    coverSelected: string;
    generate: string;
    generating: string;
    previewClose: string;
    previewModules: string;
    previewLessons: string;
    previewQuiz: string;
    previewEmpty: string;
  };
}

export const DEFAULT_COURSE_EDITOR_LABELS: CourseEditorLabels = {
  index: {
    title: 'Estructura del Curso',
    subtitle: 'Organiza módulos y lecciones',
    addModule: 'Añadir módulo',
    addLesson: 'Añadir lección',
    module: 'Módulo',
    lesson: 'Lección',
    draft: 'Borrador',
    published: 'Publicado',
    incomplete: 'Incompleto',
    emptyModule: 'Módulo sin lecciones',
    emptyModuleAction: 'Añadir primera lección',
    moduleCount: 'módulos',
    lessonCount: 'lecciones',
    materialCount: 'archivos',
    moveModuleUp: 'Subir módulo',
    moveModuleDown: 'Bajar módulo',
    moveLessonUp: 'Subir lección',
    moveLessonDown: 'Bajar lección',
    deleteModule: 'Eliminar módulo',
    deleteLesson: 'Eliminar lección',
    dragHandle: 'Reordenar',
  },
  lesson: {
    title: 'Título de la lección',
    titlePlaceholder: 'Ej. Introducción a funciones',
    type: 'Tipo de lección',
    typeText: 'Texto y código',
    typeVideo: 'Video interactivo',
    typeExcel: 'Práctica Excel',
    typeQuiz: 'Cuestionario',
    duration: 'Duración (min)',
    status: 'Estado',
    statusDraft: 'Borrador',
    statusPublished: 'Publicada',
    summary: 'Resumen pedagógico',
    summaryPlaceholder: 'Breve descripción de los objetivos...',
    content: 'Contenido completo',
    contentPlaceholder: 'Escribe el contenido en formato Markdown...',
    editTab: 'Editar',
    previewTab: 'Vista previa',
    markdownTitle: 'Formato Markdown',
    previewEmpty: 'No hay contenido para previsualizar',
    bold: 'Negrita',
    italic: 'Cursiva',
    list: 'Lista',
    code: 'Código',
    formula: 'Fórmula',
    link: 'Enlace',
    videoUrl: 'URL de video (YouTube / Vimeo)',
    videoUrlPlaceholder: 'https://www.youtube.com/watch?v=...',
    videoInvalid: 'URL de video no válida',
    videoPreview: 'Previsualización del video',
    videoAllowSeeking: 'Permitir adelantar',
    videoRequiredWatchPercent: '% mínimo para aprobar',
    videoAllowSpeedChange: 'Permitir cambio de velocidad',
    videoTodo: 'Configuración de video',
    excelTodo: 'Configuración de simulador',
    quizTodo: 'Configuración de evaluación',
    materials: {
      title: 'Materiales adjuntos',
      empty: 'No hay materiales subidos',
      emptyHint: 'Arrastra archivos o haz clic para subir',
      dropCompact: 'Subir material',
      tooLarge: 'El archivo excede el límite de 100MB',
      unsupported: 'Formato de archivo no soportado',
      uploading: 'Subiendo archivo...',
      rename: 'Renombrar',
      download: 'Descargar',
      delete: 'Eliminar',
      renameTitle: 'Renombrar archivo',
      renameAction: 'Guardar',
      renameCancel: 'Cancelar',
    },
  },
  quiz: {
    title: 'Evaluación del módulo',
    enabled: 'Evaluación activada',
    addQuestion: 'Añadir pregunta',
    question: 'Pregunta',
    prompt: 'Enunciado de la pregunta',
    explanation: 'Explicación didáctica',
    explanationPlaceholder: 'Explica por qué esta es la respuesta correcta...',
    multiple: 'Permitir selección múltiple',
    addOption: 'Añadir opción',
    removeOption: 'Eliminar opción',
    correct: 'Marcar como correcta',
    moveUp: 'Subir',
    moveDown: 'Bajar',
    removeQuestion: 'Eliminar pregunta',
    optionLabel: 'Opción',
    minOptions: 'Se requieren al menos 2 opciones',
    oneCorrect: 'Selecciona al menos una respuesta correcta',
    multipleCorrect: 'Opciones correctas',
    emptyPrompt: 'El enunciado no puede estar vacío',
    emptyOption: 'La opción no puede estar vacía',
  },
  actions: {
    save: 'Guardar cambios',
    saved: 'Cambios guardados',
    savedAgo: 'Guardado hace',
    saving: 'Guardando cambios...',
    unsaved: 'Cambios sin guardar',
    saveError: 'Error al guardar',
    retry: 'Reintentar',
    previewStudent: 'Vista de estudiante',
    publish: 'Publicar curso',
    unpublish: 'Despublicar curso',
    publishCheckTitle: 'Verificación de publicación',
    publishCheckHint: 'Revisa estos puntos antes de publicar',
    issueLessonEmpty: 'Lección sin contenido',
    issueModuleNoQuiz: 'Módulo sin evaluación',
    issueQuizInvalid: 'Evaluación incompleta',
    deleteModule: 'Eliminar módulo',
    deleteLesson: 'Eliminar lección',
    deleteMaterial: 'Eliminar material',
    confirmDeleteModuleTitle: '¿Eliminar este módulo?',
    confirmDeleteModuleBody: 'Se eliminarán todas las lecciones y materiales asociados.',
    confirmDeleteLessonTitle: '¿Eliminar esta lección?',
    confirmDeleteLessonBody: 'Esta acción no se puede deshacer.',
    confirmDeleteMaterialTitle: '¿Eliminar este material?',
    confirmDeleteMaterialBody: 'El archivo se borrará permanentemente.',
    confirmAccept: 'Eliminar',
    confirmCancel: 'Cancelar',
    undo: 'Deshacer',
    deletedModule: 'Módulo eliminado',
    deletedLesson: 'Lección eliminada',
    deletedMaterial: 'Material eliminado',
    selectPrompt: 'Selecciona una lección para editarla',
    selectModulePrompt: 'Selecciona un módulo para ver su contenido',
    autosaveHint: 'Los cambios se guardan automáticamente',
    unsavedWarning: 'Tienes cambios sin guardar. ¿Deseas salir?',
    courseHeader: 'Detalles principales',
    courseDetails: 'Configuración general del curso',
    coverSelector: 'Imagen de portada',
    coverSelected: 'Portada seleccionada',
    generate: 'Generar con IA',
    generating: 'Generando...',
    previewClose: 'Cerrar vista previa',
    previewModules: 'Módulos',
    previewLessons: 'Lecciones',
    previewQuiz: 'Evaluación',
    previewEmpty: 'Sin datos disponibles',
  },
};

function courseToInput(course: Course): CourseInput {
  return {
    title: course.title,
    subtitle: course.subtitle ?? '',
    description: course.description ?? '',
    category: course.category ?? 'Productividad',
    level: course.level ?? 'beginner',
    priceCents: course.priceCents ?? 0,
    currency: course.currency ?? 'DOP',
    coverImage: course.coverImage ?? '',
    published: course.published ?? false,
    modulesCount: course.modulesCount ?? course.modules.length,
    totalLessons: course.totalLessons ?? course.modules.reduce((acc, m) => acc + m.lessons.length, 0),
    modules: cloneModules(course.modules),
  };
}

function buildCourseFromInput(input: CourseInput, base: Course | null): Course {
  const modules = input.modules.map((module) => ({
    ...module,
    durationMinutes: module.lessons.reduce((acc, lesson) => acc + (Number(lesson.durationMinutes) || 0), 0),
  }));
  const totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0);
  return {
    id: base?.id ?? `crs_${newId('').replace('_', '')}`,
    title: input.title.trim(),
    subtitle: input.subtitle.trim(),
    description: input.description.trim(),
    category: input.category.trim() || 'Productividad',
    level: input.level,
    priceCents: input.priceCents,
    currency: input.currency,
    coverImage: input.coverImage,
    instructorId: base?.instructorId ?? 'platform-faculty',
    instructorName: base?.instructorName ?? 'Equipo DB Academy',
    published: input.published,
    modulesCount: modules.length,
    totalLessons,
    modules,
    createdAt: base?.createdAt,
    updatedAt: base?.updatedAt,
  };
}

interface CourseDetailsSectionProps {
  title: string;
  subtitle: string;
  level: Course['level'];
  priceCents: number;
  currency: Course['currency'];
  description: string;
  coverImage: string;
  uploadingCover: boolean;
  generatingCover: boolean;
  courseDetailsLabel: string;
  coverSelectorLabel: string;
  beginnerLabel: string;
  intermediateLabel: string;
  advancedLabel: string;
  onUpdateField: (patch: Partial<CourseInput>) => void;
  onUploadCoverFile: (file: File) => void;
  onGenerateCover: () => void;
}

const CourseDetailsSection: React.FC<CourseDetailsSectionProps> = memo(({
  title,
  subtitle,
  level,
  priceCents,
  currency,
  description,
  coverImage,
  uploadingCover,
  generatingCover,
  courseDetailsLabel,
  coverSelectorLabel,
  beginnerLabel,
  intermediateLabel,
  advancedLabel,
  onUpdateField,
  onUploadCoverFile,
  onGenerateCover,
}) => {
  const [coverDragging, setCoverDragging] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{courseDetailsLabel}</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Título del curso</span>
          <input
            value={title}
            onChange={(event) => onUpdateField({ title: event.target.value })}
            maxLength={140}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Subtítulo</span>
          <input
            value={subtitle}
            onChange={(event) => onUpdateField({ subtitle: event.target.value })}
            maxLength={240}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Nivel</span>
            <select
              value={level}
              onChange={(event) => onUpdateField({ level: event.target.value as Course['level'] })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-sm"
            >
              <option value="beginner">{beginnerLabel}</option>
              <option value="intermediate">{intermediateLabel}</option>
              <option value="advanced">{advancedLabel}</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Precio</span>
            <input
              type="number"
              min={0}
              value={(priceCents / 100).toString()}
              onChange={(event) =>
                onUpdateField({
                  priceCents: Math.max(0, Math.round(Number(event.target.value || 0) * 100)),
                })
              }
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-sm tabular-nums"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Moneda</span>
            <select
              value={currency}
              onChange={(event) => onUpdateField({ currency: event.target.value as Course['currency'] })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-sm"
            >
              <option value="DOP">DOP (RD$)</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="MXN">MXN</option>
            </select>
          </label>
        </div>
        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Descripción</span>
          <textarea
            rows={3}
            maxLength={2000}
            value={description}
            onChange={(event) => onUpdateField({ description: event.target.value })}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUploadCoverFile(file);
          e.target.value = '';
        }}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{coverSelectorLabel}</span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => coverFileInputRef.current?.click()}
              disabled={uploadingCover}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] px-3.5 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-60 min-h-[36px]"
            >
              {uploadingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              <span>{uploadingCover ? 'Subiendo imagen...' : 'Subir imagen desde equipo'}</span>
            </button>

            <button
              type="button"
              onClick={onGenerateCover}
              disabled={generatingCover}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors min-h-[36px]"
            >
              {generatingCover ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              )}
              <span>Cambiar portada</span>
            </button>

            {coverImage && (
              <button
                type="button"
                onClick={() => onUpdateField({ coverImage: '' })}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-2.5 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-100 min-h-[36px]"
                title="Quitar imagen actual"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Quitar</span>
              </button>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <LinkIcon className="h-3.5 w-3.5" />
            </div>
            <input
              type="url"
              placeholder="O pega aquí el enlace directo a una imagen (https://...)"
              value={coverImage.startsWith('data:') ? '' : coverImage}
              onChange={(e) => onUpdateField({ coverImage: e.target.value.trim() })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              O selecciona una de nuestras portadas prediseñadas:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {COVER_PRESETS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => onUpdateField({ coverImage: preset.url })}
                  className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                    coverImage === preset.url
                      ? 'border-blue-600 ring-2 ring-blue-600/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    loading="lazy"
                    decoding="async"
                    className="aspect-video w-full object-cover"
                  />
                  {coverImage === preset.url && (
                    <span className="absolute right-1 top-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setCoverDragging(true);
          }}
          onDragLeave={() => setCoverDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setCoverDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) onUploadCoverFile(file);
          }}
          onClick={() => coverFileInputRef.current?.click()}
          className={`aspect-video overflow-hidden rounded-xl border-2 transition-all cursor-pointer relative group flex items-center justify-center bg-slate-900 ${
            coverDragging
              ? 'border-blue-500 ring-4 ring-blue-500/20 bg-blue-950/40'
              : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'
          }`}
          title="Haz clic o arrastra una imagen aquí para subirla"
        >
          {uploadingCover ? (
            <div className="flex flex-col items-center gap-2 text-white">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              <span className="text-xs font-semibold">Subiendo imagen...</span>
            </div>
          ) : coverImage ? (
            <>
              <img src={coverImage} alt={title} decoding="async" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-3 text-center">
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-xs font-semibold">Cambiar imagen</span>
                <span className="text-[10px] text-slate-300">Haz clic o arrastra un archivo</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-slate-400 p-4 text-center">
              <ImageIcon className="h-8 w-8 text-slate-500" />
              <span className="text-xs font-medium">Haz clic o arrastra una imagen</span>
              <span className="text-[10px] text-slate-500">PNG, JPG, WebP</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

CourseDetailsSection.displayName = 'CourseDetailsSection';

function renderSyncStatusBadge(
  status: CourseSyncStatus,
  labels: CourseEditorLabels['actions']
): { dotClass: string; text: string; icon: React.ReactNode } {
  if (status === 'saving') {
    return {
      dotClass: 'bg-blue-500 animate-pulse',
      text: labels.saving,
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />,
    };
  }
  if (status === 'unsaved') {
    return {
      dotClass: 'bg-amber-500',
      text: labels.unsaved,
      icon: <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />,
    };
  }
  if (status === 'error') {
    return {
      dotClass: 'bg-red-500',
      text: labels.saveError,
      icon: <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0" />,
    };
  }
  return {
    dotClass: 'bg-emerald-500',
    text: labels.saved,
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
  };
}

export const CourseEditor: React.FC<CourseEditorProps> = ({
  course,
  onCancel,
  onCreate,
  onUpdate,
  labels = DEFAULT_COURSE_EDITOR_LABELS,
  t = (k: TranslationKeys) => k,
}) => {
  const {
    user,
    isAdmin,
    courseSyncState,
    getCourseSyncSnapshot,
    initCourseSync,
    markCourseUnsaved,
    setCourseSyncError,
    resetCourseSync,
  } = usePlatform();
  const canEdit = Boolean(isAdmin || isAuthorizedAdminEmail(user?.email));

  const [input, setInput] = useState<CourseInput>(() => (course ? courseToInput(course) : emptyInput()));
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(() => input.modules[0]?.id ?? null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(() => input.modules[0]?.lessons[0]?.id ?? null);
  const [indexOpen, setIndexOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirm, setConfirm] = useState<
    | { kind: 'module'; moduleId: string; label: string }
    | { kind: 'lesson'; moduleId: string; lessonId: string; label: string }
    | { kind: 'material'; materialId: string; label: string }
    | null
  >(null);
  const [publishIssues, setPublishIssues] = useState<boolean>(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);

  const courseRef = useRef<Course | null>(course);
  courseRef.current = course;
  const onCreateRef = useRef(onCreate);
  onCreateRef.current = onCreate;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const latestInputRef = useRef<CourseInput>(input);
  latestInputRef.current = input;
  const selectedModuleIdRef = useRef<string | null>(selectedModuleId);
  selectedModuleIdRef.current = selectedModuleId;
  const selectedLessonIdRef = useRef<string | null>(selectedLessonId);
  selectedLessonIdRef.current = selectedLessonId;

  const debounceRef = useRef<number | null>(null);
  const inFlightSaveRef = useRef<boolean>(false);
  const pendingSaveOriginRef = useRef<'auto' | 'manual' | null>(null);
  const tempCourseIdRef = useRef<string>(`tmp_${newId('crs')}`);
  const lastSnapshotRef = useRef<CourseModule[]>(input.modules);
  const lastLessonSnapshotRef = useRef<CourseLesson | null>(null);

  // Initialize centralized Firestore sync status when the editor mounts.
  useEffect(() => {
    initCourseSync(courseRef.current?.id ?? null);
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      resetCourseSync();
    };
  }, [initCourseSync, resetCourseSync]);

  const effectiveStatus: CourseSyncStatus =
    courseSyncState.status === 'idle' ? 'saved' : courseSyncState.status;
  const dirty = courseSyncState.dirtyRevision > courseSyncState.savedRevision;
  const error = courseSyncState.error ?? '';

  const selectedModuleIndex = useMemo(
    () => input.modules.findIndex((module) => module.id === selectedModuleId),
    [input.modules, selectedModuleId]
  );
  const selectedModule = selectedModuleIndex >= 0 ? input.modules[selectedModuleIndex] : null;
  const selectedLessonIndex = useMemo(
    () => (selectedModule ? selectedModule.lessons.findIndex((lesson) => lesson.id === selectedLessonId) : -1),
    [selectedModule, selectedLessonId]
  );
  const selectedLesson =
    selectedModule && selectedLessonIndex >= 0 ? selectedModule.lessons[selectedLessonIndex] : null;
  const totalLessonCount = useMemo(
    () => input.modules.reduce((acc, module) => acc + module.lessons.length, 0),
    [input.modules]
  );
  const issues = useMemo(
    () => (publishIssues ? collectPublishIssues(input.modules) : []),
    [publishIssues, input.modules]
  );

  const pushToast = useCallback(
    (
      message: string,
      options?: { variant?: ToastItem['variant']; actionLabel?: string; onAction?: () => void }
    ) => {
      const id = newId('toast');
      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          variant: options?.variant,
          actionLabel: options?.actionLabel,
          onAction: options?.onAction,
        },
      ]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 6000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateInput = useCallback(
    (updater: (prev: CourseInput) => CourseInput) => {
      setInput(updater);
      markCourseUnsaved(courseRef.current?.id ?? tempCourseIdRef.current);
    },
    [markCourseUnsaved]
  );

  const handleUpdateField = useCallback(
    (patch: Partial<CourseInput>) => {
      updateInput((prev) => ({ ...prev, ...patch }));
    },
    [updateInput]
  );

  const applyModules = useCallback(
    (updater: (modules: CourseModule[]) => CourseModule[]) => {
      updateInput((prev) => ({ ...prev, modules: updater(prev.modules) }));
    },
    [updateInput]
  );

  const updateLesson = useCallback(
    (moduleId: string, lessonId: string, patch: Partial<CourseLesson>) => {
      applyModules((modules) =>
        modules.map((module) =>
          module.id === moduleId
            ? {
                ...module,
                lessons: module.lessons.map((lesson) =>
                  lesson.id === lessonId ? { ...lesson, ...patch } : lesson
                ),
              }
            : module
        )
      );
    },
    [applyModules]
  );

  const updateModule = useCallback(
    (moduleId: string, patch: Partial<CourseModule>) => {
      applyModules((modules) =>
        modules.map((module) => (module.id === moduleId ? { ...module, ...patch } : module))
      );
    },
    [applyModules]
  );

  const handleSelectedLessonChange = useCallback(
    (patch: Partial<CourseLesson>) => {
      const modId = selectedModuleIdRef.current;
      const lesId = selectedLessonIdRef.current;
      if (!modId || !lesId) return;
      updateLesson(modId, lesId, patch);
    },
    [updateLesson]
  );

  const handleSelectedQuizChange = useCallback(
    (questions: CourseModule['questions']) => {
      const modId = selectedModuleIdRef.current;
      if (!modId) return;
      updateModule(modId, { questions });
    },
    [updateModule]
  );

  const handleSelectedQuizEnabledChange = useCallback(
    (enabled: boolean) => {
      const modId = selectedModuleIdRef.current;
      if (!modId) return;
      updateModule(modId, { quizEnabled: enabled });
    },
    [updateModule]
  );

  const handleSelectModule = useCallback((id: string) => {
    setSelectedModuleId(id);
    const mod = latestInputRef.current.modules.find((m) => m.id === id);
    setSelectedLessonId(mod?.lessons[0]?.id ?? null);
    setIndexOpen(false);
  }, []);

  const handleSelectLesson = useCallback((moduleId: string, lessonId: string) => {
    setSelectedModuleId(moduleId);
    setSelectedLessonId(lessonId);
    setIndexOpen(false);
  }, []);

  const addModule = useCallback(() => {
    if (!canEdit || latestInputRef.current.modules.length >= 12) return;
    const module = createEmptyModule(latestInputRef.current.modules.length + 1);
    applyModules((modules) => [...modules, module]);
    setSelectedModuleId(module.id);
    setSelectedLessonId(module.lessons[0]?.id ?? null);
  }, [canEdit, applyModules]);

  const addLesson = useCallback(
    (moduleId: string) => {
      if (!canEdit) return;
      const module = latestInputRef.current.modules.find((m) => m.id === moduleId);
      const lesson = createEmptyLesson((module?.lessons.length ?? 0) + 1);
      applyModules((modules) =>
        modules.map((m) => (m.id === moduleId ? { ...m, lessons: [...m.lessons, lesson] } : m))
      );
      setSelectedModuleId(moduleId);
      setSelectedLessonId(lesson.id);
    },
    [canEdit, applyModules]
  );

  const requestDeleteModule = useCallback((moduleId: string) => {
    const module = latestInputRef.current.modules.find((m) => m.id === moduleId);
    if (!module) return;
    setConfirm({
      kind: 'module',
      moduleId,
      label: module.title,
    });
  }, []);

  const requestDeleteLesson = useCallback((moduleId: string, lessonId: string) => {
    const lesson = latestInputRef.current.modules
      .find((m) => m.id === moduleId)
      ?.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;
    setConfirm({ kind: 'lesson', moduleId, lessonId, label: lesson.title });
  }, []);

  const handleDeleteSelectedLesson = useCallback(() => {
    const modId = selectedModuleIdRef.current;
    const lesId = selectedLessonIdRef.current;
    if (!modId || !lesId) return;
    requestDeleteLesson(modId, lesId);
  }, [requestDeleteLesson]);

  const handleOpenPreview = useCallback(() => {
    setPreviewCourse(buildCourseFromInput(latestInputRef.current, courseRef.current));
  }, []);

  const confirmDelete = useCallback(() => {
    if (!confirm) return;
    const currentModules = latestInputRef.current.modules;
    if (confirm.kind === 'module') {
      const module = currentModules.find((m) => m.id === confirm.moduleId);
      const lessonCount = module?.lessons.length ?? 0;
      const materialCount = module?.lessons.reduce((acc, l) => acc + (l.materials?.length ?? 0), 0) ?? 0;
      lastSnapshotRef.current = currentModules;
      const remaining = currentModules.filter((m) => m.id !== confirm.moduleId);
      applyModules(() => remaining);
      if (selectedModuleIdRef.current === confirm.moduleId) {
        setSelectedModuleId(remaining[0]?.id ?? null);
        setSelectedLessonId(remaining[0]?.lessons[0]?.id ?? null);
      }
      pushToast(
        `${labels.actions.deletedModule} · ${lessonCount} ${labels.index.lessonCount} · ${materialCount} ${labels.index.materialCount}`,
        {
          variant: 'info',
          actionLabel: labels.actions.undo,
          onAction: () => {
            applyModules(() => lastSnapshotRef.current);
          },
        }
      );
    } else if (confirm.kind === 'lesson') {
      lastSnapshotRef.current = currentModules;
      applyModules((modules) =>
        modules.map((module) =>
          module.id === confirm.moduleId
            ? { ...module, lessons: module.lessons.filter((l) => l.id !== confirm.lessonId) }
            : module
        )
      );
      if (selectedLessonIdRef.current === confirm.lessonId) setSelectedLessonId(null);
      pushToast(labels.actions.deletedLesson, {
        variant: 'info',
        actionLabel: labels.actions.undo,
        onAction: () => {
          applyModules(() => lastSnapshotRef.current);
        },
      });
    } else {
      const snapshot = lastLessonSnapshotRef.current;
      const modId = selectedModuleIdRef.current;
      const lesId = selectedLessonIdRef.current;
      const mod = currentModules.find((m) => m.id === modId);
      const les = mod?.lessons.find((l) => l.id === lesId);
      if (mod && les) {
        lastLessonSnapshotRef.current = les;
        updateLesson(mod.id, les.id, {
          materials: (les.materials ?? []).filter((m) => m.id !== confirm.materialId),
        });
        pushToast(labels.actions.deletedMaterial, {
          variant: 'info',
          actionLabel: labels.actions.undo,
          onAction: () => {
            if (snapshot) updateLesson(mod.id, les.id, { materials: snapshot.materials ?? [] });
          },
        });
      }
    }
    setConfirm(null);
  }, [confirm, applyModules, updateLesson, pushToast, labels]);

  const save = useCallback(
    async (origin: 'auto' | 'manual' = 'manual', options?: { silent?: boolean }) => {
      if (!canEdit) return;
      const currentInput = latestInputRef.current;
      const activeCourse = courseRef.current;

      if (!activeCourse && currentInput.title.trim().length < 3) {
        if (origin === 'manual' && !options?.silent) {
          const msg = 'Escribe un título de al menos 3 caracteres antes de guardar el nuevo curso.';
          setCourseSyncError(msg, tempCourseIdRef.current);
          pushToast(msg, { variant: 'error' });
        }
        return;
      }

      if (inFlightSaveRef.current) {
        pendingSaveOriginRef.current =
          pendingSaveOriginRef.current === 'manual' || origin === 'manual' ? 'manual' : 'auto';
        return;
      }

      inFlightSaveRef.current = true;
      const targetRevision = getCourseSyncSnapshot().dirtyRevision;

      try {
        const normalizedModules = currentInput.modules.map((module) => ({
          ...module,
          durationMinutes: module.lessons.reduce((acc, lesson) => acc + (Number(lesson.durationMinutes) || 0), 0),
        }));
        const payload: CourseInput = {
          ...currentInput,
          title: currentInput.title.trim(),
          subtitle: currentInput.subtitle.trim(),
          description:
            currentInput.description.trim().length >= 10
              ? currentInput.description.trim()
              : `${currentInput.subtitle.trim() || currentInput.title.trim()} — Programa de formación técnica en tiempo real.`,
          modules: normalizedModules,
          modulesCount: normalizedModules.length,
          totalLessons: normalizedModules.reduce((acc, module) => acc + module.lessons.length, 0),
        };

        if (activeCourse) {
          await onUpdateRef.current(activeCourse.id, payload, { targetRevision });
        } else {
          await onCreateRef.current(payload, { targetRevision });
        }

        const syncAfter = getCourseSyncSnapshot();
        if (syncAfter.dirtyRevision > syncAfter.savedRevision) {
          // Newer edits arrived while Firestore write was in-flight: queue follow-up save instead of claiming saved.
          pendingSaveOriginRef.current =
            pendingSaveOriginRef.current === 'manual' || origin === 'manual' ? 'manual' : 'auto';
        } else if (syncAfter.status === 'saved' && origin === 'manual' && !options?.silent) {
          pushToast(labels.actions.saved, { variant: 'success' });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : labels.actions.saveError;
        if (getCourseSyncSnapshot().status !== 'error') {
          setCourseSyncError(msg, activeCourse?.id ?? tempCourseIdRef.current);
        }
        if (origin === 'manual' && !options?.silent) {
          pushToast(labels.actions.saveError, { variant: 'error' });
        }
      } finally {
        inFlightSaveRef.current = false;
        const queuedOrigin = pendingSaveOriginRef.current;
        pendingSaveOriginRef.current = null;
        if (queuedOrigin) {
          void save(queuedOrigin, options);
        }
      }
    },
    [canEdit, getCourseSyncSnapshot, setCourseSyncError, labels.actions.saved, labels.actions.saveError, pushToast]
  );

  // Autoguardado con debounce tras ediciones sin sobrescribir estados de guardado activos.
  useEffect(() => {
    if (!dirty || !canEdit) return;
    if (uploadingCover || generatingCover || confirm !== null) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void save('auto');
    }, 3500);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [dirty, courseSyncState.dirtyRevision, canEdit, uploadingCover, generatingCover, confirm, save]);

  const handleManualSave = useCallback(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    void save('manual');
  }, [save]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (canEdit) {
          handleManualSave();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canEdit, handleManualSave]);

  const handleCloseEditor = useCallback(async () => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (
      canEdit &&
      getCourseSyncSnapshot().dirtyRevision > getCourseSyncSnapshot().savedRevision &&
      (courseRef.current || latestInputRef.current.title.trim().length >= 3)
    ) {
      await save('manual', { silent: true });
    }
    onCancel();
  }, [canEdit, getCourseSyncSnapshot, save, onCancel]);

  // Aviso al salir con cambios pendientes.
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = labels.actions.unsavedWarning;
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, labels.actions.unsavedWarning]);

  const moveModule = useCallback(
    (from: number, to: number) => {
      applyModules((modules) => reorderModules(modules, from, to));
    },
    [applyModules]
  );

  const moveLesson = useCallback(
    (moduleId: string, from: number, to: number) => {
      applyModules((modules) => reorderLessons(modules, moduleId, from, to));
    },
    [applyModules]
  );

  const moveLessonBetween = useCallback(
    (sourceModuleId: string, sourceIndex: number, targetModuleId: string, targetIndex: number) => {
      applyModules((modules) => {
        const source = modules.find((m) => m.id === sourceModuleId);
        const lesson = source?.lessons[sourceIndex];
        if (!source || !lesson) return modules;
        const without = modules.map((m) =>
          m.id === sourceModuleId ? { ...m, lessons: m.lessons.filter((_, i) => i !== sourceIndex) } : m
        );
        const target = without.find((m) => m.id === targetModuleId);
        if (!target) return modules;
        const lessons = [...target.lessons];
        lessons.splice(Math.max(0, Math.min(targetIndex, lessons.length)), 0, lesson);
        return without.map((m) => (m.id === targetModuleId ? { ...m, lessons } : m));
      });
    },
    [applyModules]
  );

  const togglePublished = useCallback(() => {
    const current = latestInputRef.current;
    if (!current.published && collectPublishIssues(current.modules).length > 0) {
      setPublishIssues(true);
      return;
    }
    updateInput((prev) => ({ ...prev, published: !prev.published }));
  }, [updateInput]);

  const handleCoverFileUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setCourseSyncError(
          'El archivo seleccionado debe ser una imagen (PNG, JPG, WebP o SVG).',
          courseRef.current?.id ?? tempCourseIdRef.current
        );
        return;
      }
      setUploadingCover(true);
      try {
        const url = await uploadCourseCoverImage(courseRef.current?.id || 'general', file);
        updateInput((prev) => ({ ...prev, coverImage: url }));
        pushToast('Imagen de portada actualizada', { variant: 'success' });
      } catch (err) {
        console.error('Error al subir imagen de portada:', err);
        setCourseSyncError(
          'Error al procesar la imagen seleccionada.',
          courseRef.current?.id ?? tempCourseIdRef.current
        );
      } finally {
        setUploadingCover(false);
      }
    },
    [updateInput, pushToast, setCourseSyncError]
  );

  const generateCover = useCallback(async () => {
    setGeneratingCover(true);
    try {
      const current = latestInputRef.current;
      const idToken = await user?.getIdToken();
      if (idToken) {
        const res = await fetch('/api/v1/courses/generate-cover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({
            title: current.title || 'Curso DB Academy',
            category: current.category,
            level: current.level,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { coverImage?: string };
          if (data.coverImage) {
            updateInput((prev) => ({ ...prev, coverImage: data.coverImage ?? '' }));
            return;
          }
        }
      }
      throw new Error('Fallback preset');
    } catch {
      const currentCover = latestInputRef.current.coverImage;
      const currentIdx = COVER_PRESETS.findIndex((p) => p.url === currentCover);
      const nextIdx = (currentIdx + 1) % COVER_PRESETS.length;
      updateInput((prev) => ({ ...prev, coverImage: COVER_PRESETS[nextIdx].url }));
    } finally {
      setGeneratingCover(false);
    }
  }, [user, updateInput]);

  const syncVisual = useMemo(
    () => renderSyncStatusBadge(effectiveStatus, labels.actions),
    [effectiveStatus, labels.actions]
  );

  const indexNode = (
    <CourseIndex
      modules={input.modules}
      selectedModuleId={selectedModuleId}
      selectedLessonId={selectedLessonId}
      onSelectModule={handleSelectModule}
      onSelectLesson={handleSelectLesson}
      onAddModule={addModule}
      onAddLesson={addLesson}
      onDeleteModule={requestDeleteModule}
      onDeleteLesson={requestDeleteLesson}
      onMoveModule={moveModule}
      onMoveLesson={moveLesson}
      onMoveLessonBetween={moveLessonBetween}
      canEdit={canEdit}
      labels={labels.index}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void handleCloseEditor()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Volver al panel de cursos"
            title="Guardar y volver al panel de cursos"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </button>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {labels.actions.courseHeader}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {input.modules.length} {labels.index.moduleCount} · {totalLessonCount} {labels.index.lessonCount}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200"
            role="status"
            aria-live="polite"
          >
            <span className={`h-2 w-2 rounded-full shrink-0 ${syncVisual.dotClass}`} />
            {syncVisual.icon}
            <span className="font-medium">{syncVisual.text}</span>
          </div>
          <button
            type="button"
            onClick={handleManualSave}
            disabled={!canEdit || effectiveStatus === 'saving'}
            title="Guardar cambios ahora (Ctrl+S)"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {effectiveStatus === 'saving' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{labels.actions.save}</span>
          </button>
          <button
            type="button"
            onClick={() => setIndexOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 xl:hidden"
          >
            {indexOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            {labels.index.title}
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="hidden xl:block xl:sticky xl:top-20 xl:h-[calc(100dvh-7rem)]">{indexNode}</div>

        <AnimatePresence>
          {indexOpen && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="fixed inset-0 z-50 bg-slate-950/50 xl:hidden"
              onClick={() => setIndexOpen(false)}
            >
              <div
                className="h-full w-[85vw] max-w-[340px] bg-white dark:bg-[#111827]"
                onClick={(event) => event.stopPropagation()}
              >
                {indexNode}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-w-0 space-y-4">
          <CourseDetailsSection
            title={input.title}
            subtitle={input.subtitle}
            level={input.level}
            priceCents={input.priceCents}
            currency={input.currency}
            description={input.description}
            coverImage={input.coverImage}
            uploadingCover={uploadingCover}
            generatingCover={generatingCover}
            courseDetailsLabel={labels.actions.courseDetails}
            coverSelectorLabel={labels.actions.coverSelector}
            beginnerLabel={t('beginner')}
            intermediateLabel={t('intermediate')}
            advancedLabel={t('advanced')}
            onUpdateField={handleUpdateField}
            onUploadCoverFile={handleCoverFileUpload}
            onGenerateCover={generateCover}
          />

          {selectedModule && selectedLesson ? (
            <LessonEditor
              key={selectedLesson.id}
              lesson={selectedLesson}
              moduleTitle={selectedModule.title}
              lessonLabel={`${selectedModuleIndex + 1}.${selectedLessonIndex + 1}`}
              onChange={handleSelectedLessonChange}
              onDelete={handleDeleteSelectedLesson}
              onPreview={handleOpenPreview}
              courseId={course?.id ?? tempCourseIdRef.current}
              canEdit={canEdit}
              labels={labels.lesson}
            />
          ) : selectedModule ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {labels.actions.selectPrompt}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {labels.actions.selectModulePrompt}
            </div>
          )}

          {selectedModule && (
            <QuizBuilder
              key={selectedModule.id}
              questions={selectedModule.questions ?? []}
              enabled={selectedModule.quizEnabled ?? true}
              onChange={handleSelectedQuizChange}
              onEnabledChange={handleSelectedQuizEnabledChange}
              labels={labels.quiz}
            />
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-30 -mx-4 border-t border-slate-200 dark:border-slate-700 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 dark:bg-[#0F1624]/95">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm" role="status" aria-live="polite">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${syncVisual.dotClass}`} />
            {syncVisual.icon}
            <span className="font-medium text-slate-700 dark:text-slate-200">{syncVisual.text}</span>
            {effectiveStatus === 'error' && (
              <button
                type="button"
                onClick={handleManualSave}
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {labels.actions.retry}
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenPreview}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Eye className="h-4 w-4" />
              {labels.actions.previewStudent}
            </button>
            <button
              type="button"
              onClick={togglePublished}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white ${
                input.published
                  ? 'bg-slate-700 hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {input.published ? labels.actions.unpublish : labels.actions.publish}
            </button>
            <button
              type="button"
              onClick={handleManualSave}
              disabled={!canEdit || effectiveStatus === 'saving'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {effectiveStatus === 'saving' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {labels.actions.save}
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {publishIssues && (
          <div className="mt-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <p className="font-semibold">{labels.actions.publishCheckTitle}</p>
            <p className="mt-0.5 text-xs">{labels.actions.publishCheckHint}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
              {issues.map((issue, index) => (
                <li key={`${issue.moduleId}-${issue.lessonId ?? 'quiz'}-${index}`}>
                  {issue.lessonLabel ? `${issue.lessonLabel} · ` : `${issue.moduleLabel} · `}
                  {issue.reason === 'lesson-empty'
                    ? labels.actions.issueLessonEmpty
                    : issue.reason === 'module-no-quiz'
                      ? labels.actions.issueModuleNoQuiz
                      : labels.actions.issueQuizInvalid}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setPublishIssues(false)}
              className="mt-2 text-xs font-medium text-amber-800 underline dark:text-amber-300"
            >
              {labels.actions.confirmCancel}
            </button>
          </div>
        )}
      </div>

      <StudentPreviewModal
        course={previewCourse}
        onClose={() => setPreviewCourse(null)}
        labels={{
          close: labels.actions.previewClose,
          modules: labels.actions.previewModules,
          lessons: labels.actions.previewLessons,
          quiz: labels.actions.previewQuiz,
          empty: labels.actions.previewEmpty,
        }}
      />
      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm?.kind === 'module'
            ? labels.actions.confirmDeleteModuleTitle
            : confirm?.kind === 'lesson'
              ? labels.actions.confirmDeleteLessonTitle
              : labels.actions.confirmDeleteMaterialTitle
        }
        body={
          confirm?.kind === 'module'
            ? `${labels.actions.confirmDeleteModuleBody} (${confirm.label})`
            : confirm?.kind === 'lesson'
              ? `${labels.actions.confirmDeleteLessonBody} (${confirm.label})`
              : `${labels.actions.confirmDeleteMaterialBody} (${confirm?.kind === 'material' ? confirm.label : ''})`
        }
        confirmLabel={labels.actions.confirmAccept}
        cancelLabel={labels.actions.confirmCancel}
        onConfirm={confirmDelete}
        onCancel={() => setConfirm(null)}
      />
      <ToastStack items={toasts} onDismiss={dismissToast} />
    </div>
  );
};

function emptyInput(): CourseInput {
  const module = createEmptyModule(1);
  return {
    title: '',
    subtitle: '',
    description: '',
    category: 'Productividad',
    level: 'beginner',
    priceCents: 60000,
    currency: 'DOP',
    coverImage: '',
    published: true,
    modulesCount: 1,
    totalLessons: 1,
    modules: [module],
  };
}
