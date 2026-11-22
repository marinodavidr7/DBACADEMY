import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileDown,
  FileSpreadsheet,
  Image as ImageIcon,
  Loader2,
  Lock,
  Pencil,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import type { TranslationKeys } from '../i18n/translations';
import { isAuthorizedAdminEmail } from '../firebase';
import type { Course } from '../types';
import { exportTableToPdf, exportToCsv } from '../utils/export';
import { AuthGateNotice } from './AuthGateNotice';
import { CouponsAdminPanel } from './CouponsAdminPanel';
import { ExerciseCreatorModal } from './ExerciseCreatorModal';
import { CourseEditor, type CourseEditorLabels, type CourseEditorInput } from './CourseEditor/CourseEditor';

const COURSE_EDITOR_LABELS = (t: (key: TranslationKeys) => string) => ({
  index: {
    title: t('editorIndexTitle'),
    subtitle: t('editorIndexSubtitle'),
    addModule: t('editorAddModule'),
    addLesson: t('editorAddLesson'),
    module: t('editorModule'),
    lesson: t('editorLesson'),
    draft: t('editorDraft'),
    published: t('editorPublished'),
    incomplete: t('editorIncomplete'),
    emptyModule: t('editorEmptyModule'),
    emptyModuleAction: t('editorEmptyModuleAction'),
    moduleCount: t('editorModuleCount'),
    lessonCount: t('editorLessonCount'),
    materialCount: t('editorMaterialCount'),
    moveModuleUp: t('editorMoveModuleUp'),
    moveModuleDown: t('editorMoveModuleDown'),
    moveLessonUp: t('editorMoveLessonUp'),
    moveLessonDown: t('editorMoveLessonDown'),
    deleteModule: t('editorDeleteModule'),
    deleteLesson: t('editorDeleteLesson'),
    dragHandle: t('editorDragHandle'),
  },
  lesson: {
    title: t('editorLessonTitle'),
    titlePlaceholder: t('editorLessonTitlePlaceholder'),
    type: t('editorLessonType'),
    typeText: t('editorTypeText'),
    typeVideo: t('editorTypeVideo'),
    typeExcel: t('editorTypeExcel'),
    typeQuiz: t('editorTypeQuiz'),
    duration: t('editorDuration'),
    status: t('editorStatus'),
    statusDraft: t('editorStatusDraft'),
    statusPublished: t('editorStatusPublished'),
    summary: t('editorSummary'),
    summaryPlaceholder: t('editorSummaryPlaceholder'),
    content: t('editorContent'),
    contentPlaceholder: t('editorContentPlaceholder'),
    editTab: t('editorEditTab'),
    previewTab: t('editorPreviewTab'),
    markdownTitle: t('editorMarkdownTitle'),
    previewEmpty: t('editorPreviewEmpty'),
    bold: t('editorBold'),
    italic: t('editorItalic'),
    list: t('editorList'),
    code: t('editorCodeLabel'),
    formula: t('editorFormula'),
    link: t('editorLink'),
    videoUrl: t('editorVideoUrl'),
    videoUrlPlaceholder: t('editorVideoUrlPlaceholder'),
    videoInvalid: t('editorVideoInvalid'),
    videoPreview: t('editorVideoPreview'),
    videoAllowSeeking: t('editorVideoAllowSeeking'),
    videoRequiredWatchPercent: t('editorVideoRequiredWatchPercent'),
    videoAllowSpeedChange: t('editorVideoAllowSpeedChange'),
    videoTodo: t('editorVideoTodo'),
    excelTodo: t('editorExcelTodo'),
    quizTodo: t('editorQuizTodo'),
    materials: {
      title: t('editorMaterials'),
      empty: t('editorMaterialsEmpty'),
      emptyHint: t('editorMaterialsEmptyHint'),
      dropCompact: t('editorMaterialsDropCompact'),
      tooLarge: t('editorMaterialsTooLarge'),
      unsupported: t('editorMaterialsUnsupported'),
      uploading: t('editorMaterialsUploading'),
      rename: t('editorMaterialsRename'),
      download: t('editorMaterialsDownload'),
      delete: t('editorMaterialsDelete'),
      renameTitle: t('editorMaterialsRenameTitle'),
      renameAction: t('editorMaterialsRenameAction'),
      renameCancel: t('editorMaterialsRenameCancel'),
    },
  },
  quiz: {
    title: t('editorQuizTitle'),
    enabled: t('editorQuizEnabled'),
    addQuestion: t('editorQuizAddQuestion'),
    question: t('editorQuizQuestion'),
    prompt: t('editorQuizPrompt'),
    explanation: t('editorQuizExplanation'),
    explanationPlaceholder: t('editorQuizExplanationPlaceholder'),
    multiple: t('editorQuizMultiple'),
    addOption: t('editorQuizAddOption'),
    removeOption: t('editorQuizRemoveOption'),
    correct: t('editorQuizCorrect'),
    moveUp: t('editorQuizMoveUp'),
    moveDown: t('editorQuizMoveDown'),
    removeQuestion: t('editorQuizRemoveQuestion'),
    optionLabel: t('editorQuizOptionLabel'),
    minOptions: t('editorQuizMinOptions'),
    oneCorrect: t('editorQuizOneCorrect'),
    multipleCorrect: t('editorQuizMultipleCorrect'),
    emptyPrompt: t('editorQuizEmptyPrompt'),
    emptyOption: t('editorQuizEmptyOption'),
  },
  actions: {
    save: t('editorSave'),
    saved: t('editorSaved'),
    savedAgo: t('editorSavedAgo'),
    saving: t('editorSaving'),
    unsaved: t('editorUnsaved'),
    saveError: t('editorSaveError'),
    retry: t('editorRetry'),
    previewStudent: t('editorPreviewStudent'),
    publish: t('editorPublish'),
    unpublish: t('editorUnpublish'),
    publishCheckTitle: t('editorPublishCheckTitle'),
    publishCheckHint: t('editorPublishCheckHint'),
    issueLessonEmpty: t('editorIssueLessonEmpty'),
    issueModuleNoQuiz: t('editorIssueModuleNoQuiz'),
    issueQuizInvalid: t('editorIssueQuizInvalid'),
    deleteModule: t('editorDeleteModule'),
    deleteLesson: t('editorDeleteLesson'),
    deleteMaterial: t('editorDeleteMaterial'),
    confirmDeleteModuleTitle: t('editorConfirmDeleteModuleTitle'),
    confirmDeleteModuleBody: t('editorConfirmDeleteModuleBody'),
    confirmDeleteLessonTitle: t('editorConfirmDeleteLessonTitle'),
    confirmDeleteLessonBody: t('editorConfirmDeleteLessonBody'),
    confirmDeleteMaterialTitle: t('editorConfirmDeleteMaterialTitle'),
    confirmDeleteMaterialBody: t('editorConfirmDeleteMaterialBody'),
    confirmAccept: t('editorConfirmAccept'),
    confirmCancel: t('editorConfirmCancel'),
    undo: t('editorUndo'),
    deletedModule: t('editorDeletedModule'),
    deletedLesson: t('editorDeletedLesson'),
    deletedMaterial: t('editorDeletedMaterial'),
    selectPrompt: t('editorSelectPrompt'),
    selectModulePrompt: t('editorSelectModulePrompt'),
    autosaveHint: t('editorAutosaveHint'),
    unsavedWarning: t('editorUnsavedWarning'),
    courseHeader: t('editorCourseHeader'),
    courseDetails: t('editorCourseDetails'),
    coverSelector: t('editorCoverSelector'),
    coverSelected: t('editorCoverSelected'),
    generate: t('editorGenerate'),
    generating: t('editorGenerating'),
    previewClose: t('editorPreviewClose'),
    previewModules: t('editorPreviewModules'),
    previewLessons: t('editorPreviewLessons'),
    previewQuiz: t('editorPreviewQuiz'),
    previewEmpty: t('editorPreviewEmpty'),
  },
});

const STUDIO_COVER_PRESETS = [
  {
    label: 'Excel / Productividad',
    url: '/src/assets/images/course_excel_basico_1795186770853.jpg',
  },
  {
    label: 'Ingeniería',
    url: '/src/assets/images/course_system_architecture_1795146988857.jpg',
  },
  {
    label: 'Datos',
    url: '/src/assets/images/course_data_science_1795146987818.jpg',
  },
  {
    label: 'Diseño',
    url: '/src/assets/images/course_ux_engineering_1795146988343.jpg',
  },
  {
    label: 'Seguridad',
    url: '/src/assets/images/course_cybersecurity_e2ee_1795146988090.jpg',
  },
];

export const InstructorDashboard: React.FC = () => {
  const {
    user,
    isAdmin,
    courses,
    instructorEnrollments,
    instructorPayments,
    createCourse,
    updateCourse,
    deleteCourse,
    setActiveView,
    setSelectedCourseId,
    t,
  } = usePlatform();

  const [adminTab, setAdminTab] = useState<'courses' | 'coupons' | 'referrals'>('courses');
  const [searchStudent, setSearchStudent] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [showExerciseCreator, setShowExerciseCreator] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [saveSuccess, setSaveSuccess] = useState('');

  const courseEditorLabels = useMemo(() => COURSE_EDITOR_LABELS(t), [t]);

  const canAdminMutate = Boolean(
    user?.emailVerified && isAdmin && isAuthorizedAdminEmail(user?.email)
  );

  const totalRevenueCents = useMemo(
    () =>
      instructorPayments.reduce(
        (acc, p) => acc + (p.status === 'succeeded' ? p.amountCents : 0),
        0
      ),
    [instructorPayments]
  );
  const avgProgress = useMemo(() => {
    if (instructorEnrollments.length === 0) return 0;
    const sum = instructorEnrollments.reduce((acc, e) => acc + e.progressPercent, 0);
    return Math.round(sum / instructorEnrollments.length);
  }, [instructorEnrollments]);
  const completedCount = useMemo(
    () => instructorEnrollments.filter((e) => e.progressPercent === 100).length,
    [instructorEnrollments]
  );

  const filteredEnrollments = useMemo(() => {
    const q = searchStudent.trim().toLowerCase();
    if (!q) return instructorEnrollments;
    return instructorEnrollments.filter(
      (e) =>
        e.studentName.toLowerCase().includes(q) ||
        e.courseTitle.toLowerCase().includes(q)
    );
  }, [instructorEnrollments, searchStudent]);

  if (!user) return <AuthGateNotice />;

  if (!canAdminMutate) {
    return (
      <div className="mx-auto my-8 max-w-xl rounded-2xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-[#111827] p-8 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Acceso restringido al Administrador
        </h2>
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          Solo el correo administrador autorizado y verificado (<span className="font-mono font-semibold">Marinodavidr7@gmail.com</span>) tiene permisos de creación, edición o borrado en la plataforma.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('catalog')}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] px-4 py-2 text-xs font-semibold text-white transition-colors min-h-[40px]"
          >
            <BookOpen className="w-4 h-4" />
            <span>Volver al catálogo</span>
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sesión actual: {user.email || 'Estudiante'}</span>
          </span>
        </div>
      </div>
    );
  }

  const handleStartNew = () => {
    if (!canAdminMutate) return;
    setEditingCourse(null);
    setSaveSuccess('');
    setShowBuilder(true);
  };

  const handleStartEdit = (course: Course) => {
    if (!canAdminMutate) return;
    setEditingCourse(course);
    setSaveSuccess('');
    setShowBuilder(true);
  };

  const handleCancelBuilder = () => {
    setShowBuilder(false);
    setEditingCourse(null);
  };

  const handleEditorCreate = async (input: CourseEditorInput) => {
    await createCourse({
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      category: input.category,
      level: input.level,
      priceCents: input.priceCents,
      currency: input.currency,
      coverImage: input.coverImage,
      published: input.published,
      modulesCount: input.modulesCount,
      totalLessons: input.totalLessons,
      modules: input.modules,
    });
    setSaveSuccess(`Curso "${input.title}" creado correctamente.`);
    setShowBuilder(false);
    setEditingCourse(null);
  };

  const handleEditorUpdate = async (courseId: string, input: CourseEditorInput) => {
    await updateCourse(courseId, {
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      category: input.category,
      level: input.level,
      priceCents: input.priceCents,
      currency: input.currency,
      coverImage: input.coverImage,
      published: input.published,
      modulesCount: input.modulesCount,
      totalLessons: input.totalLessons,
      modules: input.modules,
    });
    setSaveSuccess(`Curso "${input.title}" actualizado correctamente.`);
    setShowBuilder(false);
    setEditingCourse(null);
  };

  const handleExportProgressCsv = () => {
    exportToCsv(
      'db-academy-progreso-alumnos',
      ['Alumno', 'Curso', 'Progreso (%)', 'Minutos', 'Estado'],
      filteredEnrollments.map((e) => [
        e.studentName,
        e.courseTitle,
        e.progressPercent,
        e.studyMinutes,
        e.status,
      ])
    );
  };

  const handleExportProgressPdf = () => {
    exportTableToPdf(
      'db-academy-progreso-alumnos',
      t('liveProgressTable'),
      `Generado: ${new Date().toLocaleDateString('es-ES')}`,
      ['Alumno', 'Curso', 'Progreso (%)', 'Estudio (min)', 'Estado'],
      filteredEnrollments.map((e) => [
        e.studentName,
        e.courseTitle,
        `${e.progressPercent}%`,
        e.studyMinutes,
        e.status === 'completed' ? t('completedBadge') : 'En curso',
      ])
    );
  };

  const handleExportPaymentsCsv = () => {
    exportToCsv(
      'db-academy-pagos-ingresos',
      ['Referencia', 'Curso', 'Pasarela', 'Monto', 'Moneda', 'Estado'],
      instructorPayments.map((p) => [
        p.transactionRef,
        p.courseTitle,
        p.gateway,
        (p.amountCents / 100).toFixed(2),
        p.currency,
        p.status,
      ])
    );
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('instructorTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              {courses.length} programas en plataforma · Administrador verificado ({user.email})
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExerciseCreator(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#107C41] hover:bg-[#0d6535] px-4 py-2.5 text-xs font-semibold text-white transition-colors whitespace-nowrap min-h-[42px]"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Crear ejercicio de Excel</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (showBuilder && !editingCourse) {
                setShowBuilder(false);
              } else {
                handleStartNew();
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>{t('createCourseBtn')}</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {([
          { id: 'courses', label: 'Cursos' },
          { id: 'coupons', label: t('couponsTitle') },
          { id: 'referrals', label: t('referralsTitle') },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setAdminTab(tab.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${adminTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {adminTab === 'coupons' && <CouponsAdminPanel />}
      {adminTab === 'referrals' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 text-sm text-slate-500">
          Configuración de referidos disponible vía API /api/referrals/settings. Panel detallado pendiente de UI extendida.
        </div>
      )}

      {adminTab === 'courses' && (<>
      {saveSuccess && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 flex items-center justify-between gap-3 text-xs font-medium text-emerald-800 dark:text-emerald-300">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccess}</span>
          </span>
          <button type="button" onClick={() => setSaveSuccess('')} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('kpiStudents')}</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {instructorEnrollments.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('kpiRevenue')}</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            ${(totalRevenueCents / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('kpiAvgProgress')}</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
            {avgProgress}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('kpiCertificates')}</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {completedCount}
          </p>
        </div>
      </div>

      {/* Editor de curso: índice + editor de lección + evaluación */}
      {showBuilder && (
        <CourseEditor
          course={editingCourse}
          onCancel={handleCancelBuilder}
          onCreate={(input) => handleEditorCreate(input)}
          onUpdate={(courseId, input) => handleEditorUpdate(courseId, input)}
        />
      )}

      {/* Active Courses Strip */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Gestión de Cursos ({t('brand')})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Abre cualquier curso en el reproductor interactivo o edita todos sus módulos, lecciones y materiales.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {courses.length} programas
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="group flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-[#0F1624] hover:shadow-md transition-shadow"
            >
              <div
                className="aspect-video w-full bg-slate-900 overflow-hidden relative cursor-pointer"
                onClick={() => {
                  setSelectedCourseId(course.id);
                  setActiveView('learning');
                }}
              >
                {course.coverImage ? (
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 text-[10px] font-mono font-semibold text-white">
                  ${(course.priceCents / 100).toFixed(2)} {course.currency}
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    <span>
                      {course.category} · {course.published ? 'Publicado' : 'Borrador'}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">
                      {course.modules.length} mód · {course.totalLessons} {t('lessonsLabel')}
                    </span>
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {course.subtitle || course.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800/80 px-3 py-2 bg-slate-50/70 dark:bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(course.id);
                      setActiveView('learning');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                    title="Abrir curso en el reproductor interactivo"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Abrir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(course.id);
                      setActiveView('catalog');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                    title="Ver en el catálogo"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(course)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-md transition-colors"
                    title="Editar todos los módulos, lecciones y materiales"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Editar todo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError('');
                      setCourseToDelete(course);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                    title="Eliminar curso"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-Time Student Progress Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t('liveProgressTable')}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Filtrar alumno..."
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <button
              type="button"
              onClick={handleExportProgressCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportProgressPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-5 font-medium">Estudiante</th>
                <th className="py-3 px-5 font-medium">Curso</th>
                <th className="py-3 px-5 font-medium text-right">Estudio</th>
                <th className="py-3 px-5 font-medium text-right">Progreso</th>
                <th className="py-3 px-5 font-medium text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    Sin inscripciones registradas todavía. Inscríbete en un curso para visualizar el seguimiento en tiempo real.
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((enr) => (
                  <tr
                    key={enr.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-5 font-medium text-slate-900 dark:text-slate-100">
                      {enr.studentName}
                    </td>
                    <td className="py-3 px-5 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {enr.courseTitle}
                    </td>
                    <td className="py-3 px-5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {enr.studyMinutes} min
                    </td>
                    <td className="py-3 px-5 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {enr.progressPercent}%
                    </td>
                    <td className="py-3 px-5 text-right">
                      <span
                        className={
                          enr.status === 'completed'
                            ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                            : 'text-blue-600 dark:text-blue-400 font-medium'
                        }
                      >
                        {enr.status === 'completed' ? t('completedBadge') : 'Activo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Gateway Transactions Ledger */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Registro de pasarelas de pago
          </h2>
          <button
            type="button"
            onClick={handleExportPaymentsCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{t('exportCsv')}</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-5 font-medium">Referencia</th>
                <th className="py-3 px-5 font-medium">Curso</th>
                <th className="py-3 px-5 font-medium">Pasarela</th>
                <th className="py-3 px-5 font-medium text-right">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {instructorPayments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500 dark:text-slate-400">
                    Sin transacciones registradas aún.
                  </td>
                </tr>
              ) : (
                instructorPayments.map((pay) => (
                  <tr key={pay.id}>
                    <td className="py-3 px-5 font-mono text-slate-700 dark:text-slate-300">
                      {pay.transactionRef}
                    </td>
                    <td className="py-3 px-5 text-slate-900 dark:text-slate-100 max-w-xs truncate">
                      {pay.courseTitle}
                    </td>
                    <td className="py-3 px-5 uppercase text-slate-600 dark:text-slate-300">
                      {pay.gateway}
                    </td>
                    <td className="py-3 px-5 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {(pay.amountCents / 100).toFixed(2)} {pay.currency}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Course Confirmation Modal */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  ¿Eliminar este curso?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Acción exclusiva del administrador verificado ({user.email}).
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3.5 text-xs">
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                {courseToDelete.title}
              </p>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {courseToDelete.category} · {courseToDelete.totalLessons} lecciones
              </p>
            </div>

            {deleteError && (
              <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-2.5 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteError('');
                  setCourseToDelete(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting || !canAdminMutate}
                onClick={async () => {
                  if (!canAdminMutate) {
                    setDeleteError(
                      'Acceso denegado: solo Marinodavidr7@gmail.com puede eliminar cursos.'
                    );
                    return;
                  }
                  setDeleting(true);
                  setDeleteError('');
                  try {
                    await deleteCourse(courseToDelete.id);
                    setCourseToDelete(null);
                  } catch (err) {
                    setDeleteError(
                      err instanceof Error
                        ? err.message
                        : 'No se pudo eliminar el curso. Verifica tus permisos de administrador.'
                    );
                  } finally {
                    setDeleting(false);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-xs font-semibold text-white transition-colors min-h-[38px]"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Sí, eliminar curso</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ExerciseCreatorModal
        open={showExerciseCreator}
        onClose={() => setShowExerciseCreator(false)}
        onCreated={(ex) =>
          setSaveSuccess(
            `Ejercicio "${ex.title}" (${ex.functionTag}) creado y disponible en la lección.`
          )
        }
      />
      </>)}
    </div>
  );
};
