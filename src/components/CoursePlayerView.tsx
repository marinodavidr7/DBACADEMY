import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Archive,
  Award,
  BookOpen,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Code,
  Compass,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  GitBranch,
  HelpCircle,
  Image as ImageIcon,
  Keyboard,
  Lightbulb,
  Maximize2,
  Minimize2,
  Paperclip,
  Pencil,
  PlayCircle,
  Search,
  Sparkles,
  Terminal,
  User,
  Video,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import type { Certificate, CourseMaterial, CourseMaterialType } from '../types';
import { formatFileSize } from '../services/storageService';
import { exportCertificatePdf } from '../utils/export';
import { AuthGateNotice } from './AuthGateNotice';
import type { FormulaMode, SimulatorExternalPreset } from './ExcelSimulator3D';
import { InteractiveExcelLab } from './InteractiveExcelLab';

const ExcelSimulator3D = lazy(() =>
  import('./ExcelSimulator3D').then((m) => ({ default: m.ExcelSimulator3D }))
);

/* ------------------------------------------------------------------ */
/*  MaterialsTab — pestaña de descarga de materiales                   */
/* ------------------------------------------------------------------ */
function getMaterialIcon(type: CourseMaterialType): React.ReactNode {
  const cls = 'w-4 h-4 shrink-0';
  const map: Record<CourseMaterialType, React.ReactNode> = {
    pdf: <FileText className={cls} />,
    video: <Video className={cls} />,
    doc: <FileText className={cls} />,
    spreadsheet: <FileSpreadsheet className={cls} />,
    image: <ImageIcon className={cls} />,
    zip: <Archive className={cls} />,
    other: <Paperclip className={cls} />,
  };
  return map[type] ?? <Paperclip className={cls} />;
}

const typeLabel: Record<CourseMaterialType, string> = {
  pdf: 'PDF',
  video: 'Video',
  doc: 'Documento',
  spreadsheet: 'Hoja de cálculo',
  image: 'Imagen',
  zip: 'Archivo comprimido',
  other: 'Archivo',
};

function MaterialsTab({ materials }: { materials: CourseMaterial[] }) {
  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
        <Paperclip className="w-8 h-8 opacity-50" />
        <p className="text-sm">Esta lección no tiene materiales adjuntos.</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          El instructor puede agregar archivos desde el panel de administración.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
        <Paperclip className="w-3.5 h-3.5 text-blue-500" />
        <span>{materials.length} material{materials.length !== 1 ? 'es' : ''} disponible{materials.length !== 1 ? 's' : ''} para esta lección</span>
      </div>
      <div className="space-y-2">
        {materials.map((mat) => (
          <a
            key={mat.id}
            href={mat.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-4 py-3 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
            download={mat.sizeByte > 0 ? mat.name : undefined}
          >
            <span className="text-blue-600 dark:text-blue-400">
              {getMaterialIcon(mat.type)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                {mat.name}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {typeLabel[mat.type] ?? 'Archivo'}
                {mat.sizeByte > 0 && ` · ${formatFileSize(mat.sizeByte)}`}
                {mat.sizeByte === 0 && ' · Enlace externo'}
              </p>
            </div>
            <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}

export const CoursePlayerView: React.FC = () => {
  const {
    user,
    isAdmin,
    courses,
    enrollments,
    certificates,
    selectedCourseId,
    setSelectedCourseId,
    setActiveView,
    setWorkspaceRole,
    zenMode,
    setZenMode,
    toggleZenMode,
    completeLesson,
    t,
  } = usePlatform();

  const [viewAsStudent, setViewAsStudent] = useState(false);

  const enrolledCourses = useMemo(() => {
    // Modo estudiante: ignora el bypass de administrador y filtra como alumno normal
    if (isAdmin && !viewAsStudent) return courses;
    return courses.filter(
      (c) => enrollments.some((e) => e.courseId === c.id) || c.instructorId === user?.uid
    );
  }, [courses, enrollments, isAdmin, user?.uid, viewAsStudent]);

  const activeCourse = useMemo(() => {
    if (selectedCourseId) {
      const found = enrolledCourses.find((c) => c.id === selectedCourseId);
      if (found) return found;
    }
    return enrolledCourses[0] || null;
  }, [enrolledCourses, selectedCourseId]);

  const activeEnrollment = useMemo(() => {
    if (!activeCourse) return null;
    const real = enrollments.find((e) => e.courseId === activeCourse.id);
    if (real) return real;
    // En modo estudiante no se crea un preview sintético: sin inscripción real no hay acceso
    if ((isAdmin || activeCourse.instructorId === user?.uid) && !viewAsStudent) {
      return {
        id: `preview_${activeCourse.id}`,
        courseId: activeCourse.id,
        courseTitle: activeCourse.title,
        studentId: user?.uid || 'admin-preview',
        studentName: user?.displayName || user?.email || 'Administrador',
        instructorId: activeCourse.instructorId,
        completedModuleIds: [],
        completedLessonIds: [],
        progressPercent: 0,
        studyMinutes: 0,
        status: 'active' as const,
      };
    }
    return null;
  }, [enrollments, activeCourse, isAdmin, user, viewAsStudent]);

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizFeedback, setQuizFeedback] = useState<Record<string, 'passed' | 'failed'>>({});
  const [saving, setSaving] = useState(false);
  const [newlyIssuedCert, setNewlyIssuedCert] = useState<Certificate | null>(null);
  const [showSimulator, setShowSimulator] = useState(true);
  const [externalPreset, setExternalPreset] = useState<SimulatorExternalPreset | null>(null);
  const [activeTab, setActiveTab] = useState<'reader' | 'syntax' | 'lab' | 'materials'>('reader');
  const [searchTopic, setSearchTopic] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [quickNotes, setQuickNotes] = useState<string>(() => {
    try {
      return localStorage.getItem('dbacademy_reader_notes') || '';
    } catch {
      return '';
    }
  });

  const inFlightLessonsRef = useRef<Set<string>>(new Set());
  const simulatorWrapRef = useRef<HTMLDivElement | null>(null);

  const allLessons = useMemo(
    () =>
      activeCourse
        ? activeCourse.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m })))
        : [],
    [activeCourse]
  );

  const currentLessonIndex = useMemo(() => {
    if (allLessons.length === 0) return -1;
    const idx = allLessons.findIndex((l) => l.id === activeLessonId);
    return idx >= 0 ? idx : 0;
  }, [allLessons, activeLessonId]);

  const currentLesson = currentLessonIndex >= 0 ? allLessons[currentLessonIndex] : null;
  const isLessonDone = Boolean(
    currentLesson && activeEnrollment?.completedLessonIds.includes(currentLesson.id)
  );

  const markSubModuleComplete = useCallback(
    async (lessonId: string, _lessonTitle: string, durationMinutes: number) => {
      if (!activeCourse || !activeEnrollment) return;
      if (activeEnrollment.completedLessonIds.includes(lessonId)) return;
      if (inFlightLessonsRef.current.has(lessonId)) return;

      inFlightLessonsRef.current.add(lessonId);
      setSaving(true);
      try {
        const res = await completeLesson(activeCourse, lessonId, durationMinutes);
        if (res.certificateIssued) {
          setNewlyIssuedCert(res.certificateIssued);
        }
      } finally {
        inFlightLessonsRef.current.delete(lessonId);
        setSaving(false);
      }
    },
    [activeCourse, activeEnrollment, completeLesson]
  );

  // Reset tab and spotlight SI simulator when switching sub-modules
  useEffect(() => {
    setActiveTab('reader');
    if (currentLesson?.id === 'les-excel-1-13') {
      setShowSimulator(true);
    }
  }, [currentLesson?.id]);

  // Esc key exits Zen Mode cleanly and leaving view resets Zen Mode
  useEffect(() => {
    if (!zenMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZenMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zenMode, setZenMode]);

  useEffect(() => {
    return () => setZenMode(false);
  }, [setZenMode]);

  if (!user) return <AuthGateNotice />;

  if (enrolledCourses.length === 0 || !activeCourse || !activeEnrollment || !currentLesson) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center max-w-xl mx-auto my-8">
        <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('myCoursesTitle')}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('noEnrollments')}</p>
        <button
          type="button"
          onClick={() => setActiveView('catalog')}
          className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors min-h-[44px]"
        >
          {t('exploreCatalog')}
        </button>
      </div>
    );
  }

  const earnedCert =
    newlyIssuedCert || certificates.find((c) => c.courseId === activeCourse.id) || null;
  const isExcelCourse =
    activeCourse.id === 'excel-basico-05' || /excel/i.test(activeCourse.title);
  const recommendedSimMode: FormulaMode = /CONTAR\.SI/i.test(currentLesson.title)
    ? 'CONTAR.SI'
    : /SUMAR\.SI/i.test(currentLesson.title)
      ? 'SUMAR.SI'
      : /ANIDADO/i.test(currentLesson.title)
        ? 'SI.ANIDADO'
        : 'SI';

  const launchDecisionSimulation = (mode: FormulaMode, presetId: string) => {
    setShowSimulator(true);
    setExternalPreset({ mode, presetId, nonce: Date.now() });
    window.setTimeout(() => {
      simulatorWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  };

  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < allLessons.length - 1
      ? allLessons[currentLessonIndex + 1]
      : null;

  const handleCompleteLesson = async () => {
    await markSubModuleComplete(
      currentLesson.id,
      currentLesson.title,
      currentLesson.durationMinutes
    );
  };

  const handleNavigateLesson = async (targetLessonId: string, completeCurrentFirst: boolean) => {
    if (completeCurrentFirst && !isLessonDone) {
      await markSubModuleComplete(
        currentLesson.id,
        currentLesson.title,
        currentLesson.durationMinutes
      );
    }
    setActiveLessonId(targetLessonId);
  };

  const handleCheckQuiz = (moduleId: string, correctIndex: number) => {
    const picked = quizAnswers[moduleId];
    const passed = picked === correctIndex;
    setQuizFeedback((prev) => ({
      ...prev,
      [moduleId]: passed ? 'passed' : 'failed',
    }));
    if (passed && !isLessonDone) {
      void markSubModuleComplete(
        currentLesson.id,
        currentLesson.title,
        currentLesson.durationMinutes
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Zen Mode Minimal Focus Bar vs Standard Course Header */}
      {zenMode ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {activeCourse.title} · {currentLesson.title}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t('zenActiveHint')} ·{' '}
              <span className="font-mono tabular-nums">{activeEnrollment.progressPercent}%</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setZenMode(false)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 dark:bg-slate-100 px-3.5 py-2 text-xs font-semibold text-white dark:text-slate-900 hover:opacity-90 transition-opacity whitespace-nowrap min-h-[38px]"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>{t('exitZenMode')}</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {t('myCoursesTitle')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {activeCourse.title} ·{' '}
              <span className="tabular-nums">
                {activeEnrollment.studyMinutes} {t('studyMinutes')}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {(isAdmin || activeCourse.instructorId === user.uid) && (
              <button
                type="button"
                onClick={() => {
                  setWorkspaceRole('instructor');
                  setSelectedCourseId(activeCourse.id);
                  setActiveView('instructor');
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-2 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors whitespace-nowrap min-h-[42px]"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Editar curso</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setViewAsStudent((v) => !v)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap min-h-[42px] ${
                  viewAsStudent
                    ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                title={viewAsStudent ? 'Desactivar modo estudiante' : 'Ver como estudiante'}
              >
                <User className="w-3.5 h-3.5" />
                <span>
                  {viewAsStudent ? 'Modo estudiante: ON' : 'Modo estudiante: OFF'}
                </span>
              </button>
            )}

            {isExcelCourse && (
              <button
                type="button"
                onClick={() => setShowSimulator((v) => !v)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap min-h-[42px] ${
                  showSimulator
                    ? 'bg-[#107C41] text-white'
                    : 'border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-[#107C41] dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
                }`}
              >
                <Box className="w-4 h-4" />
                <span>{showSimulator ? t('simHideLab') : t('simOpenLab')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleZenMode}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap min-h-[42px]"
            >
              <Maximize2 className="w-4 h-4" />
              <span>{t('zenMode')}</span>
            </button>

            <select
              value={activeCourse.id}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setActiveLessonId(null);
                setNewlyIssuedCert(null);
              }}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[42px]"
            >
              {enrolledCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Integrated 3D Formula Simulator Lab inside the Excel Course (temporarily hidden in Zen Mode) */}
      <div ref={simulatorWrapRef}>
        <AnimatePresence initial={false}>
          {!zenMode && isExcelCourse && showSimulator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <Suspense
                fallback={
                  <div className="h-[420px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                    Cargando Simulador 3D...
                  </div>
                }
              >
                <ExcelSimulator3D
                  compact
                  externalMode={recommendedSimMode}
                  externalPreset={externalPreset}
                  onInteract={() => {
                    if (!isLessonDone) {
                      void markSubModuleComplete(
                        currentLesson.id,
                        currentLesson.title,
                        currentLesson.durationMinutes
                      );
                    }
                  }}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live Progress Bar & Auto Certificate Banner (hidden in Zen Mode for minimal clutter) */}
      {!zenMode && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {activeEnrollment.completedLessonIds.length} / {allLessons.length} {t('subModulesLabel')} ·{' '}
            {activeEnrollment.completedModuleIds.length} / {activeCourse.modules.length} {t('modulesLabel')}
          </span>
          <span className="text-sm font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
            {activeEnrollment.progressPercent}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${activeEnrollment.progressPercent}%` }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className={`h-full ${
              activeEnrollment.progressPercent === 100 ? 'bg-emerald-600' : 'bg-blue-600'
            }`}
          />
        </div>

        {earnedCert && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t('certificatesTitle')}
                </p>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {earnedCert.verificationCode}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => exportCertificatePdf(earnedCert)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors whitespace-nowrap min-h-[40px]"
            >
              <Award className="w-3.5 h-3.5" />
              <span>{t('downloadPdf')}</span>
            </button>
          </div>
        )}
        </div>
      )}

      {/* Two-Zone Course Stage + Syllabus (Syllabus hidden & stage maximized in Zen Mode) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={zenMode ? 'lg:col-span-12 space-y-6' : 'lg:col-span-8 space-y-6'}>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
            <div className="aspect-video bg-slate-950 relative">
              <img
                src={activeCourse.coverImage}
                alt={currentLesson.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent flex flex-col justify-end p-6">
                <div className="flex items-center gap-2 text-xs text-blue-300">
                  <PlayCircle className="w-4 h-4" />
                  <span>{currentLesson.module.title}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{currentLesson.durationMinutes} min</span>
                </div>
                <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-white">
                  {currentLesson.title}
                </h2>
              </div>
            </div>

            {/* NetAcad Multi-Tab Switcher: Concepto / Sintaxis & Terminal / Notas de Laboratorio */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 px-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('reader')}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === 'reader'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>1. Teoría & Fundamento</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('syntax')}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === 'syntax'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Terminal className="w-4 h-4" />
                <span>2. Sintaxis & Troubleshooting</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('lab')}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeTab === 'lab'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Code className="w-4 h-4" />
                <span>3. Notas de Campo</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('materials')}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap relative ${
                  activeTab === 'materials'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Paperclip className="w-4 h-4" />
                <span>4. Materiales</span>
                {(currentLesson.materials?.length ?? 0) > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold">
                    {currentLesson.materials!.length}
                  </span>
                )}
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tab 1: Reader Text */}
              {activeTab === 'reader' && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentLesson.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="rounded-lg border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                        <Lightbulb className="w-4 h-4" />
                        <span>Objetivo de Competencia (Skill Target)</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                        {currentLesson.summary}
                      </p>
                    </div>

                    <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                      <p className={zenMode ? 'text-[15px] leading-7' : 'text-sm leading-relaxed'}>
                        {currentLesson.content}
                      </p>
                    </div>

                    {/* Pro Tip Callout (Cisco NetAcad Insight style) */}
                    <div className="rounded-lg border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block mb-0.5">Buenas Prácticas de Ingeniería:</span>
                        <span>
                          En producción, nunca anides más de 3 niveles sin documentar la jerarquía.
                          Verifica siempre las referencias absolutas ($) antes de duplicar bloques de fórmulas a escala.
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {activeTab === 'reader' && isExcelCourse && (
                <div className="pt-2 space-y-5">
                  {currentLesson.id === 'les-excel-1-13' && (
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          <GitBranch className="w-4 h-4" />
                          <span>Simulador de =SI() y Toma de Decisiones</span>
                        </div>
                        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          Elige un escenario para verlo en la cinta 3D
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => launchDecisionSimulation('SI', 'si-aprobado')}
                          className="rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 px-3 py-2 text-left hover:border-[#107C41] transition-colors"
                        >
                          <span className="block font-mono text-[11px] font-bold text-[#107C41] dark:text-emerald-400">
                            =SI(Caja&gt;=60)
                          </span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Nota Aprobatoria
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => launchDecisionSimulation('SI.ANIDADO', 'si-anidado-3-vias')}
                          className="rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 px-3 py-2 text-left hover:border-amber-500 transition-colors"
                        >
                          <span className="block font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            =SI() Anidado (3 vías)
                          </span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Clasificación 3 niveles
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => launchDecisionSimulation('Y', 'si-y-envio')}
                          className="rounded-lg border border-sky-300 dark:border-sky-800 bg-white dark:bg-slate-900 px-3 py-2 text-left hover:border-sky-500 transition-colors"
                        >
                          <span className="block font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400">
                            =SI(Y(...))
                          </span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Doble condición (Peso)
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => launchDecisionSimulation('O', 'si-o-express')}
                          className="rounded-lg border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 px-3 py-2 text-left hover:border-indigo-500 transition-colors"
                        >
                          <span className="block font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            =SI(O(...))
                          </span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Prioridad Express / VIP
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  <InteractiveExcelLab
                    lessonId={currentLesson.id}
                    lessonTitle={currentLesson.title}
                    mode="lab"
                    onSolved={() => {
                      if (!isLessonDone) {
                        void markSubModuleComplete(
                          currentLesson.id,
                          currentLesson.title,
                          currentLesson.durationMinutes
                        );
                      }
                    }}
                  />
                </div>
              )}

              {/* Tab 2: Syntax & Troubleshooting Inspector */}
              {activeTab === 'syntax' && (
                isExcelCourse ? (
                  <InteractiveExcelLab
                    lessonId={currentLesson.id}
                    lessonTitle={currentLesson.title}
                    mode="syntax"
                    onSolved={() => {
                      setActiveTab('reader');
                    }}
                  />
                ) : (
                <div className="space-y-4 text-xs font-mono">
                  <div className="rounded-xl bg-[#090D16] border border-slate-800 p-4 space-y-3">
                    <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-1.5 font-sans font-semibold text-[11px] text-blue-400">
                        <Terminal className="w-3.5 h-3.5" />
                        CONSOLA DE SINTAXIS Y PARSEO
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(`=PROMEDIO(A1:A50)`);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="flex items-center gap-1 text-[11px] hover:text-white transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedCode ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>

                    <div className="space-y-1.5 text-slate-200 font-mono text-xs">
                      <p className="text-slate-500">// Anatomía de función estándar:</p>
                      <p className="text-emerald-400 font-bold">=FUNCION(argumento_requerido, [argumento_opcional])</p>
                      <p className="text-slate-500 mt-2">// Casos frecuentes de error y resolución:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-sans">
                        <div className="p-2.5 rounded border border-red-900/60 bg-red-950/20 text-red-300">
                          <span className="font-mono font-bold block">#¡VALOR!</span>
                          <span className="text-[11px] text-slate-400">Tipo de dato incompatible (ej. texto sumado a número).</span>
                        </div>
                        <div className="p-2.5 rounded border border-amber-900/60 bg-amber-950/20 text-amber-300">
                          <span className="font-mono font-bold block">#REF!</span>
                          <span className="text-[11px] text-slate-400">Celda o rango eliminado físicamente de la hoja.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )
              )}

              {/* Tab 3: Field Engineering Notes */}
              {activeTab === 'lab' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      Cuaderno de Laboratorio del Alumno (Guardado local automático)
                    </span>
                    <span className="text-[10px] text-slate-400">Persistente en tu navegador</span>
                  </div>
                  <textarea
                    rows={6}
                    value={quickNotes}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuickNotes(val);
                      try {
                        localStorage.setItem('dbacademy_reader_notes', val);
                      } catch {}
                    }}
                    placeholder="Escribe aquí tus observaciones, pruebas de fórmulas o dudas antes del examen modular..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-3.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
              )}

              {/* Tab 4: Materiales descargables */}
              {activeTab === 'materials' && (
                <MaterialsTab materials={currentLesson.materials ?? []} />
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span className="tabular-nums">{currentLesson.durationMinutes} min</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {prevLesson && (
                    <button
                      type="button"
                      onClick={() => void handleNavigateLesson(prevLesson.id, false)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[42px]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>{t('prevSubModule')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={saving || isLessonDone}
                    onClick={() => void handleCompleteLesson()}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors min-h-[42px] ${
                      isLessonDone
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isLessonDone ? t('lessonCompleted') : t('completeLesson')}</span>
                  </button>

                  {nextLesson && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleNavigateLesson(nextLesson.id, false)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-4 py-2 text-xs font-medium text-white dark:text-slate-900 hover:opacity-90 transition-opacity min-h-[42px]"
                    >
                      <span>{t('nextSubModule')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Module Checkpoint Quiz */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t('moduleQuiz')} · {currentLesson.module.title}
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {currentLesson.module.quizQuestion}
            </p>
            <div className="space-y-2">
              {currentLesson.module.quizOptions.map((opt, idx) => (
                <label
                  key={opt}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-sm cursor-pointer transition-colors ${
                    quizAnswers[currentLesson.module.id] === idx
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 text-slate-900 dark:text-slate-100'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <input
                    type="radio"
                    name={`quiz-${currentLesson.module.id}`}
                    checked={quizAnswers[currentLesson.module.id] === idx}
                    onChange={() =>
                      setQuizAnswers((prev) => ({ ...prev, [currentLesson.module.id]: idx }))
                    }
                    className="accent-blue-600"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  handleCheckQuiz(currentLesson.module.id, currentLesson.module.quizCorrectIndex)
                }
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-900 dark:bg-slate-100 px-4 py-2 text-xs font-medium text-white dark:text-slate-900 hover:opacity-90 transition-opacity min-h-[40px]"
              >
                {t('verifyQuiz')}
              </button>
              {quizFeedback[currentLesson.module.id] === 'passed' && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {t('quizPassed')}
                </span>
              )}
              {quizFeedback[currentLesson.module.id] === 'failed' && (
                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                  {t('quizTryAgain')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Syllabus Tree (NetAcad Style Module Explorer) */}
        {!zenMode && (
          <aside className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
            {/* NetAcad Search Header */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchTopic}
                  onChange={(e) => setSearchTopic(e.target.value)}
                  placeholder="Buscar tema en el temario..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[700px] overflow-y-auto">
            {activeCourse.modules.map((mod) => {
              const modDone = activeEnrollment.completedModuleIds.includes(mod.id);
              const doneInModule = mod.lessons.filter((l) =>
                activeEnrollment.completedLessonIds.includes(l.id)
              ).length;
              const modPct = Math.round((doneInModule / (mod.lessons.length || 1)) * 100);

              const filteredLessons = mod.lessons.filter(
                (l) =>
                  !searchTopic ||
                  l.title.toLowerCase().includes(searchTopic.toLowerCase()) ||
                  l.summary.toLowerCase().includes(searchTopic.toLowerCase())
              );

              if (searchTopic && filteredLessons.length === 0) return null;

              return (
                <div key={mod.id} className="p-4 space-y-2.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                        {mod.title}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                        {doneInModule}/{mod.lessons.length}
                        {modDone && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          modDone ? 'bg-emerald-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${modPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    {filteredLessons.map((lesson) => {
                      const done = activeEnrollment.completedLessonIds.includes(lesson.id);
                      const active = currentLesson.id === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => setActiveLessonId(lesson.id)}
                          className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors min-h-[38px] ${
                            active
                              ? 'bg-blue-600 text-white font-medium shadow-xs'
                              : done
                                ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            {done ? (
                              <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                            ) : (
                              <Circle className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-blue-200' : 'text-slate-400'}`} />
                            )}
                            <span className="truncate">{lesson.title}</span>
                          </span>
                          <span className={`font-mono tabular-nums text-[10px] shrink-0 ${active ? 'text-blue-100' : 'text-slate-400'}`}>
                            {lesson.durationMinutes}m
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
