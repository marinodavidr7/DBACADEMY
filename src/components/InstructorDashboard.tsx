import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Eye,
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
import { isAuthorizedAdminEmail, isPlaceholderCampusEmail } from '../firebase';
import type { Certificate, Course } from '../types';
import { formatCurrency } from '../utils/currency';
import { exportCertificatePdf, exportTableToPdf, exportToCsv } from '../utils/export';
import { AuthGateNotice } from './AuthGateNotice';
import { CertificateDocumentCard, CertificatePreviewModal } from './CertificatePreviewModal';
import { CouponsAdminPanel } from './CouponsAdminPanel';
import { GiftCardsAdminPanel } from './GiftCardsAdminPanel';
import { StudentManagement } from './StudentManagement';
import { ExerciseCreatorModal } from './ExerciseCreatorModal';
import { CourseEditor, type CourseEditorLabels, type CourseEditorInput } from './CourseEditor/CourseEditor';
import { AssignmentInbox } from './AssignmentInbox';

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
    url: '/assets/images/course_excel_basico_1795186770853.webp',
  },
  {
    label: 'Ingeniería',
    url: '/assets/images/course_system_architecture_1795146988857.webp',
  },
  {
    label: 'Datos',
    url: '/assets/images/course_data_science_1795146987818.webp',
  },
  {
    label: 'Diseño',
    url: '/assets/images/course_ux_engineering_1795146988343.webp',
  },
  {
    label: 'Seguridad',
    url: '/assets/images/course_cybersecurity_e2ee_1795146988090.webp',
  },
];

export const InstructorDashboard: React.FC = () => {
  const {
    user,
    isAdmin,
    courses,
    instructorEnrollments,
    instructorPayments,
    instructorCertificates,
    createCourse,
    updateCourse,
    deleteCourse,
    setActiveView,
    selectedCourseId,
    setSelectedCourseId,
    t,
    assignmentSubmissions,
    giftCards,
    studentEmailsMap,
  } = usePlatform();

  const [adminTab, setAdminTab] = useState<'courses' | 'students' | 'certificates' | 'giftcards' | 'coupons' | 'referrals' | 'submissions'>('courses');
  const [searchStudent, setSearchStudent] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [showExerciseCreator, setShowExerciseCreator] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editorSessionId, setEditorSessionId] = useState(0);
  const autoOpenedCourseIdRef = useRef<string | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [previewCert, setPreviewCert] = useState<{ cert: Certificate; isSample?: boolean } | null>(null);
  const [sampleCourseId, setSampleCourseId] = useState('');
  const [sampleStudentName, setSampleStudentName] = useState('María Fernanda López');

  const [saveSuccess, setSaveSuccess] = useState('');

  const courseEditorLabels = useMemo(() => COURSE_EDITOR_LABELS(t), [t]);

  const canAdminMutate = Boolean(
    isAdmin || isAuthorizedAdminEmail(user?.email)
  );

  useEffect(() => {
    if (!selectedCourseId) {
      autoOpenedCourseIdRef.current = null;
      return;
    }
    if (autoOpenedCourseIdRef.current === selectedCourseId) return;
    if (courses.length > 0) {
      const target = courses.find((c) => c.id === selectedCourseId);
      if (target) {
        autoOpenedCourseIdRef.current = selectedCourseId;
        setEditingCourse(target);
        setEditorSessionId((n) => n + 1);
        setShowBuilder(true);
      }
    }
  }, [selectedCourseId, courses]);

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

  const uniqueStudentsCount = useMemo(
    () => new Set(instructorEnrollments.map((e) => e.studentId)).size,
    [instructorEnrollments]
  );

  const resolveEnrollmentEmail = useCallback(
    (enr: { studentId: string; studentEmail?: string }) => {
      if (!isPlaceholderCampusEmail(enr.studentEmail)) return enr.studentEmail!.trim();
      const mapped = studentEmailsMap[enr.studentId];
      return !isPlaceholderCampusEmail(mapped) ? mapped.trim() : '';
    },
    [studentEmailsMap]
  );

  const filteredEnrollments = useMemo(() => {
    const q = searchStudent.trim().toLowerCase();
    if (!q) return instructorEnrollments;
    return instructorEnrollments.filter((e) => {
      const email = resolveEnrollmentEmail(e).toLowerCase();
      return (
        e.studentName.toLowerCase().includes(q) ||
        email.includes(q) ||
        e.courseTitle.toLowerCase().includes(q)
      );
    });
  }, [instructorEnrollments, searchStudent, resolveEnrollmentEmail]);

  const sampleCourse = useMemo(
    () => courses.find((c) => c.id === sampleCourseId) || courses[0] || null,
    [courses, sampleCourseId]
  );

  const sampleCertificate: Certificate = useMemo(
    () => ({
      id: 'cert_admin_preview',
      verificationCode: 'DB-EXCEL-PREVIEW01',
      courseId: sampleCourse?.id || '',
      courseTitle: sampleCourse?.title || 'Nuestro curso de Excel',
      studentId: user?.uid || 'admin',
      studentName: sampleStudentName.trim() || user?.displayName || 'Estudiante DB Academy',
      instructorId: sampleCourse?.instructorId || 'admin',
      instructorName: sampleCourse?.instructorName || 'Equipo DB Academy',
      completionPercent: 100,
      hashSignature: '8f4e2a9c1b7d3065f12a4c890de341fa7b92c6018e54ab3190cd7712e4f8a109',
      issuedAt: new Date().toISOString(),
    }),
    [sampleCourse, sampleStudentName, user]
  );

  const handleCancelBuilder = useCallback(() => {
    setShowBuilder(false);
    setEditingCourse(null);
  }, []);

  const handleEditorCreate = useCallback(
    async (input: CourseEditorInput, syncOptions?: { targetRevision?: number }): Promise<Course> => {
      const created = await createCourse(
        {
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
        },
        syncOptions
      );
      setEditingCourse(created);
      return created;
    },
    [createCourse]
  );

  const handleEditorUpdate = useCallback(
    async (courseId: string, input: CourseEditorInput, syncOptions?: { targetRevision?: number }) => {
      await updateCourse(
        courseId,
        {
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
        },
        syncOptions
      );
      setEditingCourse((prev) =>
        prev && prev.id === courseId
          ? {
              ...prev,
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
            }
          : prev
      );
    },
    [updateCourse]
  );

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
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-4 py-2 text-xs font-semibold text-[var(--dba-accent-foreground)] transition-colors min-h-[40px]"
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
    setEditorSessionId((n) => n + 1);
    setShowBuilder(true);
  };

  const handleStartEdit = (course: Course) => {
    if (!canAdminMutate) return;
    setEditingCourse(course);
    setSaveSuccess('');
    setEditorSessionId((n) => n + 1);
    setShowBuilder(true);
  };

  const handleExportProgressCsv = () => {
    exportToCsv(
      'db-academy-progreso-alumnos',
      ['Alumno', 'Correo', 'Curso', 'Progreso (%)', 'Minutos', 'Estado'],
      filteredEnrollments.map((e) => [
        e.studentName,
        resolveEnrollmentEmail(e) || '—',
        e.courseTitle,
        e.progressPercent,
        e.studyMinutes,
        e.status,
      ])
    );
  };

  const handleExportProgressPdf = () => {
    void exportTableToPdf(
      'db-academy-progreso-alumnos',
      t('liveProgressTable'),
      `Generado: ${new Date().toLocaleDateString('es-ES')}`,
      ['Alumno', 'Correo', 'Curso', 'Progreso (%)', 'Estudio (min)', 'Estado'],
      filteredEnrollments.map((e) => [
        e.studentName,
        resolveEnrollmentEmail(e) || '—',
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
    <div className="space-y-4">
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
            onClick={() => setPreviewCert({ cert: sampleCertificate, isSample: true })}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors whitespace-nowrap min-h-[40px]"
          >
            <Award className="w-4 h-4" />
            <span>Ver certificados</span>
          </button>
          <button
            type="button"
            onClick={() => setShowExerciseCreator(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#107C41] hover:bg-[#0d6535] px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap min-h-[40px]"
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
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>{t('createCourseBtn')}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800">
        {([
          { id: 'courses', label: 'Cursos' },
          { id: 'students', label: `Estudiantes (${uniqueStudentsCount})` },
          { id: 'giftcards', label: `Gift Cards (${giftCards.length})` },
          { id: 'certificates', label: `Certificados (${instructorCertificates.length})` },
          { id: 'coupons', label: t('couponsTitle') },
          { id: 'referrals', label: t('referralsTitle') },
          { id: 'submissions', label: `Entregas (${assignmentSubmissions.filter((s) => s.status === 'submitted').length})` },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setAdminTab(tab.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${adminTab === tab.id ? 'border-[var(--dba-accent-ink)] text-[var(--dba-accent-ink)] font-semibold' : 'border-transparent text-[var(--dba-text-secondary)] hover:text-[var(--dba-text-primary)]'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {adminTab === 'certificates' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--dba-border)] pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[var(--dba-text-primary)] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[var(--dba-accent-ink)]" />
                  <span>Vista previa del certificado oficial con logo DB Academy</span>
                </h2>
                <p className="text-xs text-[var(--dba-text-secondary)] mt-0.5">
                  Comprueba cómo se ve el diploma oficial que reciben los estudiantes y descárgalo en PDF.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewCert({ cert: sampleCertificate, isSample: true })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--dba-border)] px-3 py-2 text-xs font-semibold text-[var(--dba-text-primary)] hover:bg-stone-50 dark:hover:bg-zinc-800"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ampliar</span>
                </button>
                <button
                  type="button"
                  onClick={() => void exportCertificatePdf(sampleCertificate)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-3.5 py-2 text-xs font-semibold text-[var(--dba-accent-foreground)]"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Descargar PDF de muestra</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Programa de muestra
                </label>
                <select
                  value={sampleCourse?.id || ''}
                  onChange={(e) => setSampleCourseId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nombre de estudiante de prueba
                </label>
                <input
                  type="text"
                  value={sampleStudentName}
                  onChange={(e) => setSampleStudentName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <CertificateDocumentCard certificate={sampleCertificate} isSample={true} />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Certificados emitidos a estudiantes ({instructorCertificates.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Estudiante</th>
                    <th className="py-2.5 px-4 font-medium">Curso</th>
                    <th className="py-2.5 px-4 font-medium">Código</th>
                    <th className="py-2.5 px-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {instructorCertificates.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500 dark:text-slate-400">
                        Todavía no hay certificados reales emitidos por estudiantes. Puedes usar la vista previa superior para inspeccionar el diseño final.
                      </td>
                    </tr>
                  ) : (
                    instructorCertificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                          {cert.studentName}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                          {cert.courseTitle}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-blue-600 dark:text-blue-400">
                          {cert.verificationCode}
                        </td>
                        <td className="py-2.5 px-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setPreviewCert({ cert, isSample: false })}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void exportCertificatePdf(cert)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-2.5 py-1 text-xs font-medium text-white"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {adminTab === 'students' && (
        <StudentManagement
          onPreviewCertificate={(cert) => setPreviewCert({ cert, isSample: false })}
        />
      )}
      {adminTab === 'giftcards' && <GiftCardsAdminPanel />}
      {adminTab === 'coupons' && <CouponsAdminPanel />}
      {adminTab === 'referrals' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 text-sm text-slate-500">
          El programa de referidos se encuentra en preparación. Mientras tanto, puedes emitir códigos promocionales desde Gift Cards o Cupones.
        </div>
      )}

      {adminTab === 'submissions' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
          <AssignmentInbox />
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => setAdminTab('students')}
          className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 hover:border-blue-400/70 transition-colors"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{t('kpiStudents')}</span>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Ver todos →</span>
          </p>
          <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {instructorEnrollments.length}
          </p>
        </button>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('kpiRevenue')}</p>
          <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {formatCurrency(totalRevenueCents, instructorPayments[0]?.currency || courses[0]?.currency || 'DOP')}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('kpiAvgProgress')}</p>
          <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
            {avgProgress}%
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdminTab('certificates')}
          className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 hover:border-emerald-400/70 transition-colors"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{t('kpiCertificates')}</span>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Ver diseño →</span>
          </p>
          <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {instructorCertificates.length || completedCount}
          </p>
        </button>
      </div>

      {/* Editor de curso: índice + editor de lección + evaluación */}
      {showBuilder && (
        <CourseEditor
          key={editorSessionId}
          course={editingCourse}
          onCancel={handleCancelBuilder}
          onCreate={handleEditorCreate}
          onUpdate={handleEditorUpdate}
          labels={courseEditorLabels}
          t={t}
        />
      )}

      {/* Active Courses Strip */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-3.5">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="group flex flex-col rounded-xl border border-[var(--dba-border)] overflow-hidden bg-[var(--dba-bg-surface)] hover:shadow-md transition-shadow"
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
                    width={1280}
                    height={714}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 text-[10px] font-mono font-semibold text-white">
                  {formatCurrency(course.priceCents, course.currency)}
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
                <th className="py-3 px-5 font-medium">Correo</th>
                <th className="py-3 px-5 font-medium">Curso</th>
                <th className="py-3 px-5 font-medium text-right">Estudio</th>
                <th className="py-3 px-5 font-medium text-right">Progreso</th>
                <th className="py-3 px-5 font-medium text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    Sin inscripciones registradas todavía. Inscríbete en un curso para visualizar el seguimiento en tiempo real.
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((enr) => {
                  const email = resolveEnrollmentEmail(enr);
                  return (
                    <tr
                      key={enr.id}
                      onClick={() => setAdminTab('students')}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-5 font-medium text-slate-900 dark:text-slate-100">
                        {enr.studentName}
                      </td>
                      <td className="py-3 px-5 text-slate-600 dark:text-slate-300">
                        {email || '—'}
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
                  );
                })
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
                      {formatCurrency(pay.amountCents, pay.currency)}
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

      {previewCert && (
        <CertificatePreviewModal
          certificate={previewCert.cert}
          isSample={previewCert.isSample}
          onClose={() => setPreviewCert(null)}
        />
      )}
    </div>
  );
};
