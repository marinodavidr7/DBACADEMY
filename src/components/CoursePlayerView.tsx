import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Archive,
  ArrowRight,
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
  Lock,
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
import { EXCEL_CURRICULUM } from '../data/excelCurriculum';
import type { Certificate, CourseMaterial, CourseMaterialType } from '../types';
import { formatFileSize } from '../services/storageService';
import { exportCertificatePdf } from '../utils/export';
import { AuthGateNotice } from './AuthGateNotice';
import { ExcelGridBasicsViewer } from './ExcelGridBasicsViewer';
import type { FormulaMode, SimulatorExternalPreset } from './ExcelSimulator3D';
import { InteractiveExcelLab } from './InteractiveExcelLab';
import { CourseProgressBar } from './ui/CourseProgressBar';

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
    customExercises,
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
    return courses.filter((c) => enrollments.some((e) => e.courseId === c.id));
  }, [courses, enrollments, isAdmin, viewAsStudent]);

  const activeCourse = useMemo(() => {
    if (selectedCourseId) {
      const found = courses.find((c) => c.id === selectedCourseId);
      if (found) return found;
    }
    return enrolledCourses[0] || courses[0] || null;
  }, [courses, enrolledCourses, selectedCourseId]);

  const activeEnrollment = useMemo(() => {
    if (!activeCourse) return null;
    const real = enrollments.find((e) => e.courseId === activeCourse.id);
    if (real) return real;
    // En modo estudiante no se crea un preview sintético: sin inscripción real no hay acceso
    if (isAdmin && !viewAsStudent) {
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
  const [showSimulator, setShowSimulator] = useState(false);
  const [externalPreset, setExternalPreset] = useState<SimulatorExternalPreset | null>(null);
  const [activeTab, setActiveTab] = useState<'reader' | 'practice' | 'syntax' | 'lab' | 'materials'>('reader');
  const [requestedExampleId, setRequestedExampleId] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [searchTopic, setSearchTopic] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [lockWarning, setLockWarning] = useState<string | null>(null);
  const [previewCompletedByCourse, setPreviewCompletedByCourse] = useState<Record<string, string[]>>({});
  const [quickNotes, setQuickNotes] = useState<string>(() => {
    try {
      return localStorage.getItem('dbacademy_reader_notes') || '';
    } catch {
      return '';
    }
  });

  const inFlightLessonsRef = useRef<Set<string>>(new Set());
  const simulatorWrapRef = useRef<HTMLDivElement | null>(null);

  const isSyntheticPreview = Boolean(activeEnrollment?.id.startsWith('preview_'));

  const effectiveCompletedLessonIds = useMemo(() => {
    if (!activeCourse || !activeEnrollment) return [] as string[];
    if (!isSyntheticPreview) return activeEnrollment.completedLessonIds;
    return Array.from(
      new Set([
        ...activeEnrollment.completedLessonIds,
        ...(previewCompletedByCourse[activeCourse.id] ?? []),
      ])
    );
  }, [activeCourse, activeEnrollment, isSyntheticPreview, previewCompletedByCourse]);

  const completedLessonSet = useMemo(
    () => new Set(effectiveCompletedLessonIds),
    [effectiveCompletedLessonIds]
  );

  const allLessons = useMemo(
    () =>
      activeCourse
        ? activeCourse.modules.flatMap((m, mIdx) =>
            m.lessons.map((l, lIdx) => ({
              ...l,
              module: m,
              moduleIndex: mIdx,
              lessonInModuleIndex: lIdx,
            }))
          )
        : [],
    [activeCourse]
  );

  const moduleProgression = useMemo(() => {
    if (!activeCourse) {
      return {
        firstIncompleteModuleIndex: 0,
        firstIncompleteLessonIndex: 0,
        moduleIndexById: new Map<string, number>(),
        lessonModuleIndexById: new Map<string, number>(),
        lessonGlobalIndexById: new Map<string, number>(),
        moduleMetaById: new Map<
          string,
          { doneCount: number; totalCount: number; isCompleted: boolean; remainingCount: number }
        >(),
      };
    }

    const moduleIndexById = new Map<string, number>();
    const lessonModuleIndexById = new Map<string, number>();
    const lessonGlobalIndexById = new Map<string, number>();
    const moduleMetaById = new Map<
      string,
      { doneCount: number; totalCount: number; isCompleted: boolean; remainingCount: number }
    >();

    let firstIncompleteModuleIndex = activeCourse.modules.length;
    let globalCounter = 0;

    activeCourse.modules.forEach((mod, mIdx) => {
      moduleIndexById.set(mod.id, mIdx);
      let doneCount = 0;
      mod.lessons.forEach((lesson) => {
        lessonModuleIndexById.set(lesson.id, mIdx);
        lessonGlobalIndexById.set(lesson.id, globalCounter);
        globalCounter += 1;
        if (completedLessonSet.has(lesson.id)) {
          doneCount += 1;
        }
      });
      const totalCount = mod.lessons.length;
      const isCompleted = totalCount === 0 || doneCount === totalCount;
      const remainingCount = Math.max(0, totalCount - doneCount);
      moduleMetaById.set(mod.id, { doneCount, totalCount, isCompleted, remainingCount });

      if (!isCompleted && firstIncompleteModuleIndex === activeCourse.modules.length) {
        firstIncompleteModuleIndex = mIdx;
      }
    });

    const firstIncompleteIdx = allLessons.findIndex((l) => !completedLessonSet.has(l.id));
    const firstIncompleteLessonIndex =
      firstIncompleteIdx >= 0 ? firstIncompleteIdx : allLessons.length;

    return {
      firstIncompleteModuleIndex,
      firstIncompleteLessonIndex,
      moduleIndexById,
      lessonModuleIndexById,
      lessonGlobalIndexById,
      moduleMetaById,
    };
  }, [activeCourse, allLessons, completedLessonSet]);

  const effectiveCompletedModuleIds = useMemo(() => {
    if (!activeCourse) return [] as string[];
    return activeCourse.modules
      .filter((m) => moduleProgression.moduleMetaById.get(m.id)?.isCompleted)
      .map((m) => m.id);
  }, [activeCourse, moduleProgression]);

  const effectiveProgressPercent = useMemo(() => {
    if (!activeCourse || !activeEnrollment) return 0;
    if (!isSyntheticPreview) return activeEnrollment.progressPercent;
    const total = activeCourse.modules.reduce((acc, m) => acc + m.lessons.length, 0) || 1;
    return Math.min(100, Math.round((effectiveCompletedLessonIds.length / total) * 100));
  }, [activeCourse, activeEnrollment, isSyntheticPreview, effectiveCompletedLessonIds.length]);

  const isModuleUnlocked = useCallback(
    (moduleId: string) => {
      const idx = moduleProgression.moduleIndexById.get(moduleId) ?? 0;
      return idx <= moduleProgression.firstIncompleteModuleIndex;
    },
    [moduleProgression]
  );

  const isLessonUnlocked = useCallback(
    (lessonId: string) => {
      const globalIdx = moduleProgression.lessonGlobalIndexById.get(lessonId);
      if (globalIdx === undefined) return false;
      return globalIdx <= moduleProgression.firstIncompleteLessonIndex;
    },
    [moduleProgression]
  );

  const defaultUnlockedLessonIndex = useMemo(() => {
    if (allLessons.length === 0) return -1;
    const firstIncompleteUnlocked = allLessons.findIndex(
      (l) => isLessonUnlocked(l.id) && !completedLessonSet.has(l.id)
    );
    if (firstIncompleteUnlocked >= 0) return firstIncompleteUnlocked;
    const firstUnlocked = allLessons.findIndex((l) => isLessonUnlocked(l.id));
    return firstUnlocked >= 0 ? firstUnlocked : 0;
  }, [allLessons, isLessonUnlocked, completedLessonSet]);

  const currentLessonIndex = useMemo(() => {
    if (allLessons.length === 0) return -1;
    if (activeLessonId) {
      const idx = allLessons.findIndex((l) => l.id === activeLessonId);
      if (idx >= 0 && isLessonUnlocked(allLessons[idx].id)) {
        return idx;
      }
    }
    return defaultUnlockedLessonIndex;
  }, [allLessons, activeLessonId, isLessonUnlocked, defaultUnlockedLessonIndex]);

  const currentLesson = currentLessonIndex >= 0 ? allLessons[currentLessonIndex] : null;
  const isLessonDone = Boolean(
    currentLesson && completedLessonSet.has(currentLesson.id)
  );
  const blockingLesson =
    allLessons[moduleProgression.firstIncompleteLessonIndex] ?? null;

  const isExcelCourse = Boolean(
    activeCourse && (activeCourse.id === 'excel-basico-05' || /excel/i.test(activeCourse.title))
  );

  const prereqCourses = useMemo(() => {
    if (!activeCourse?.prerequisites || activeCourse.prerequisites.length === 0) return [];
    return courses.filter((c) => activeCourse.prerequisites?.includes(c.id));
  }, [activeCourse, courses]);

  const prereqsMet = useMemo(() => {
    if (prereqCourses.length === 0) return true;
    if (isAdmin && !viewAsStudent) return true;
    return prereqCourses.every((p) => {
      const enr = enrollments.find((e) => e.courseId === p.id);
      const hasCert = certificates.some((c) => c.courseId === p.id);
      return (enr && enr.progressPercent >= 100) || hasCert;
    });
  }, [prereqCourses, enrollments, certificates, isAdmin, viewAsStudent]);
  const isSiLesson = currentLesson?.id === 'les-excel-1-13';
  const isGridBasicsLesson = currentLesson?.id === 'les-excel-0-0';
  const lessonExerciseCount = useMemo(() => {
    if (!isExcelCourse || !currentLesson) return 0;
    const base = (EXCEL_CURRICULUM[currentLesson.id] || EXCEL_CURRICULUM['les-excel-0-1'])?.exercises.length ?? 0;
    const custom = customExercises.filter((ce) => ce.lessonId === currentLesson.id).length;
    return base + custom;
  }, [isExcelCourse, currentLesson, customExercises]);

  const selectLesson = useCallback(
    (targetLessonId: string) => {
      if (!activeCourse) return;
      if (!isLessonUnlocked(targetLessonId)) {
        const targetModIdx = moduleProgression.lessonModuleIndexById.get(targetLessonId) ?? 0;
        const blockingMod =
          activeCourse.modules[moduleProgression.firstIncompleteModuleIndex] ??
          activeCourse.modules[0];
        if (targetModIdx > moduleProgression.firstIncompleteModuleIndex) {
          setLockWarning(
            `Módulo y capítulo bloqueados: completa primero "${blockingLesson?.title ?? 'la lección actual'}" (${blockingMod?.title ?? 'módulo anterior'}) para desbloquear este contenido.`
          );
        } else {
          setLockWarning(
            `Capítulo bloqueado: completa primero "${blockingLesson?.title ?? 'el capítulo anterior'}" para desbloquear este capítulo.`
          );
        }
        return;
      }
      setLockWarning(null);
      setActiveLessonId(targetLessonId);
    },
    [activeCourse, isLessonUnlocked, moduleProgression, blockingLesson]
  );

  // Guard: if activeLessonId ever points to a locked chapter/module, snap to unlocked lesson
  useEffect(() => {
    if (!activeLessonId || !currentLesson) return;
    if (activeLessonId !== currentLesson.id) {
      setActiveLessonId(currentLesson.id);
    }
  }, [activeLessonId, currentLesson]);

  const markSubModuleComplete = useCallback(
    async (lessonId: string, _lessonTitle: string, durationMinutes: number) => {
      if (!activeCourse || !activeEnrollment) return;
      if (completedLessonSet.has(lessonId)) return;

      if (isSyntheticPreview) {
        setPreviewCompletedByCourse((prev) => ({
          ...prev,
          [activeCourse.id]: Array.from(new Set([...(prev[activeCourse.id] ?? []), lessonId])),
        }));
        setLockWarning(null);
        return;
      }

      if (inFlightLessonsRef.current.has(lessonId)) return;

      inFlightLessonsRef.current.add(lessonId);
      setSaving(true);
      try {
        const res = await completeLesson(activeCourse, lessonId, durationMinutes);
        setLockWarning(null);
        if (res.certificateIssued) {
          setNewlyIssuedCert(res.certificateIssued);
        }
      } finally {
        inFlightLessonsRef.current.delete(lessonId);
        setSaving(false);
      }
    },
    [activeCourse, activeEnrollment, completedLessonSet, isSyntheticPreview, completeLesson]
  );

  // Reset tab, clear stale example selection, and auto-open 3D simulator strictly on 1.13 SI
  useEffect(() => {
    setActiveTab('reader');
    setRequestedExampleId(null);
    setLockWarning(null);
    const isSi = currentLesson?.id === 'les-excel-1-13';
    setShowSimulator(isSi);
    if (currentLesson?.module?.id) {
      setExpandedModules((prev) => ({
        ...prev,
        [currentLesson.module.id]: true,
      }));
    }
  }, [currentLesson?.id, currentLesson?.module?.id]);

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

  if (activeCourse && prereqCourses.length > 0 && !prereqsMet && (!isAdmin || viewAsStudent)) {
    const unmetPrereq = prereqCourses[0];
    const unmetEnrollment = enrollments.find((e) => e.courseId === unmetPrereq?.id);
    const progress = unmetEnrollment?.progressPercent ?? 0;

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="rounded-2xl border border-amber-300 dark:border-amber-800/80 bg-white dark:bg-[#0F172A] p-8 sm:p-10 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 flex items-center justify-center mx-auto text-amber-700 dark:text-amber-400">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="mt-5 font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Acceso bloqueado por prerrequisito
          </h2>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
            Para acceder a las lecciones de{' '}
            <strong className="text-slate-900 dark:text-white">{activeCourse.title}</strong>, debes
            completar y aprobar primero el 100% del nivel anterior:
          </p>

          {unmetPrereq && (
            <div className="mt-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-left">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  Prerrequisito obligatorio
                </span>
                <span className="font-mono">{progress}% completado</span>
              </div>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100 text-sm">
                {unmetPrereq.title}
              </p>
              <div className="mt-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {unmetPrereq && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCourseId(unmetPrereq.id);
                  setActiveView('learning');
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] px-5 py-2.5 text-sm font-semibold text-white transition-colors min-h-[44px]"
              >
                <span>Ir a {unmetPrereq.title.split(':')[0]}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveView('catalog')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors min-h-[44px]"
            >
              <span>Volver al catálogo</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

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

  const launchDecisionSimulation = (mode: FormulaMode, presetId: string) => {
    setActiveTab('reader');
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
  const isNextLessonLocked = Boolean(nextLesson && !isLessonUnlocked(nextLesson.id));
  const currentModuleMeta = moduleProgression.moduleMetaById.get(currentLesson.module.id);

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
    selectLesson(targetLessonId);
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
        <div className="space-y-4">
          {/* Student Dashboard Header with Real Progress Metrics */}
          <section className="rounded-xl border border-slate-800/90 bg-[#070E1D] text-slate-100 p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-cyan-300">
                  Panel del estudiante · {user.displayName || user.email}
                </p>
                <h1 className="mt-1 font-display text-xl sm:text-2xl font-bold text-white">
                  {t('myCoursesTitle')}
                </h1>
                <p className="text-xs text-slate-300 mt-1">
                  {activeCourse.title} ·{' '}
                  <span className="font-mono tabular-nums">
                    {activeEnrollment.studyMinutes} {t('studyMinutes')}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                <div className="rounded-lg border border-slate-800 bg-[#0D1930] px-3.5 py-2.5">
                  <p className="text-[11px] text-slate-400">Cursos activos</p>
                  <p className="text-lg font-bold font-mono tabular-nums text-white">
                    {enrolledCourses.length}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#0D1930] px-3.5 py-2.5">
                  <p className="text-[11px] text-slate-400">Progreso curso</p>
                  <p className="text-lg font-bold font-mono tabular-nums text-cyan-300">
                    {effectiveProgressPercent}%
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#0D1930] px-3.5 py-2.5">
                  <p className="text-[11px] text-slate-400">Lecciones</p>
                  <p className="text-lg font-bold font-mono tabular-nums text-white">
                    {effectiveCompletedLessonIds.length}/{activeCourse.totalLessons}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#0D1930] px-3.5 py-2.5">
                  <p className="text-[11px] text-slate-400">Certificados</p>
                  <p className="text-lg font-bold font-mono tabular-nums text-emerald-400">
                    {certificates.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/90">
              <CourseProgressBar
                percent={effectiveProgressPercent}
                label={`Avance en ${activeCourse.title}`}
                size="md"
              />
            </div>
          </section>

          {prereqCourses.length > 0 && !prereqsMet && (
            <div className="rounded-xl border border-amber-200/90 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    Ruta formativa recomendada
                  </p>
                  <p className="text-amber-800 dark:text-amber-300/80 mt-0.5">
                    Este curso asume conocimientos previos de{' '}
                    <strong>{prereqCourses.map((p) => p.title).join(', ')}</strong>. Puedes repasarlo si encuentras conceptos nuevos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (prereqCourses[0]) {
                    setSelectedCourseId(prereqCourses[0].id);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-amber-900/40 px-3 py-1.5 font-semibold text-amber-900 dark:text-amber-100 hover:bg-amber-100/70 dark:hover:bg-amber-800/50 transition-colors whitespace-nowrap self-start sm:self-auto shrink-0 min-h-[32px]"
              >
                <span>Ver curso previo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">

          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin && (
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
                setLockWarning(null);
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
        </div>
      )}

      {/* Auto Certificate Banner when course is completed */}
      {!zenMode && earnedCert && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

      {/* Two-Zone Course Stage + Syllabus (Syllabus hidden & stage maximized in Zen Mode) */}
      <div className={`grid grid-cols-1 ${zenMode ? '' : 'xl:grid-cols-[minmax(0,1fr)_clamp(320px,24vw,400px)]'} gap-6 2xl:gap-10 items-start`}>
        <div className="min-w-0 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
            {/* Compact Lesson Header (no giant 16:9 image pushing content off-screen) */}
            <div className="relative bg-[#070E1D] border-b border-slate-800 p-5 sm:p-6 overflow-hidden">
              <img
                src={activeCourse.coverImage}
                alt={currentLesson.title}
                referrerPolicy="no-referrer"
                className="absolute inset-y-0 right-0 w-1/2 h-full object-cover opacity-20 pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#070E1D] via-[#070E1D]/95 to-[#070E1D]/60 pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-300 font-semibold">
                    <PlayCircle className="w-4 h-4 shrink-0" />
                    <span>{currentLesson.module.title}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-slate-300">
                      {currentLesson.durationMinutes} min
                    </span>
                    {isSiLesson && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-semibold">
                        Incluye Simulador 3D =SI()
                      </span>
                    )}
                    {isGridBasicsLesson && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-400/40 text-blue-300 text-[11px] font-semibold">
                        Cuadrícula 2D Interactiva
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-lg sm:text-2xl font-bold text-white leading-snug">
                    {currentLesson.title}
                  </h2>
                </div>
                {isLessonDone && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 shrink-0 self-start sm:self-center">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lección completada</span>
                  </span>
                )}
              </div>
            </div>

            {/* Clean Step-by-Step Tabs */}
            <div className="flex items-center overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 px-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('reader')}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeTab === 'reader'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>{isExcelCourse ? '1. Teoría y Ejemplos' : '1. Teoría & Fundamento'}</span>
              </button>

              {isExcelCourse ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('practice')}
                  className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                    activeTab === 'practice'
                      ? 'border-[#107C41] text-[#107C41] dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>2. Práctica en Excel</span>
                  {lessonExerciseCount > 0 && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-[#107C41] dark:text-emerald-300 font-mono text-[11px] font-bold">
                      {lessonExerciseCount}
                    </span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('syntax')}
                  className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                    activeTab === 'syntax'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  <span>2. Sintaxis & Troubleshooting</span>
                </button>
              )}

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
                <span>3. Apuntes</span>
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
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                    {currentLesson.materials!.length}
                  </span>
                )}
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Tab 1: Theory & Practical Examples (+ 3D Simulator ONLY on 1.13 SI) */}
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
                        <span>Objetivo de la lección</span>
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

                    {!isExcelCourse && (
                      <div className="rounded-lg border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block mb-0.5">Buenas Prácticas de Ingeniería:</span>
                          <span>
                            Verifica siempre las referencias absolutas ($) y los tipos de datos antes de escalar tus fórmulas.
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              {activeTab === 'reader' && isExcelCourse && (
                <div className="space-y-5">
                  {isGridBasicsLesson && (
                    <div className="space-y-3">
                      <ExcelGridBasicsViewer />
                    </div>
                  )}

                  <InteractiveExcelLab
                    lessonId={currentLesson.id}
                    lessonTitle={currentLesson.title}
                    mode="guide"
                    onRequestExamplePractice={(exId) => {
                      setRequestedExampleId(exId);
                      setActiveTab('practice');
                    }}
                    onGoToPractice={() => {
                      setRequestedExampleId(null);
                      setActiveTab('practice');
                    }}
                  />

                  {/* Simulador 3D interactivo: EXCLUSIVO de 1.13 SI (Función lógica de decisión) */}
                  {isSiLesson && (
                    <div ref={simulatorWrapRef} className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                            <GitBranch className="w-4 h-4" />
                            <span>Simulador 3D de =SI() y Toma de Decisiones</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowSimulator((v) => !v)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors min-h-[34px] ${
                              showSimulator
                                ? 'bg-[#107C41] text-white'
                                : 'border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 text-[#107C41] dark:text-emerald-300 hover:bg-emerald-50'
                            }`}
                          >
                            <Box className="w-3.5 h-3.5" />
                            <span>{showSimulator ? t('simHideLab') : t('simOpenLab')}</span>
                          </button>
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

                      <AnimatePresence initial={false}>
                        {showSimulator && (
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
                                externalMode="SI"
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
                  )}
                </div>
              )}

              {/* Tab 2 (Excel): Dedicated Interactive Spreadsheet Exercises Workspace */}
              {activeTab === 'practice' && isExcelCourse && (
                <InteractiveExcelLab
                  lessonId={currentLesson.id}
                  lessonTitle={currentLesson.title}
                  mode="practice"
                  requestedExampleId={requestedExampleId}
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
              )}

              {/* Tab 2 (Non-Excel): Syntax & Troubleshooting Inspector */}
              {activeTab === 'syntax' && !isExcelCourse && (
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
              }

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

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span className="tabular-nums">{currentLesson.durationMinutes} min</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Módulo: {currentModuleMeta?.doneCount ?? 0}/{currentModuleMeta?.totalCount ?? 0} completadas
                    </span>
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
                      isNextLessonLocked ? (
                        <button
                          type="button"
                          disabled
                          title={
                            nextLesson.module.id !== currentLesson.module.id
                              ? `Completa "${currentLesson.title}" y todo ${currentLesson.module.title} para desbloquear ${nextLesson.module.title}`
                              : `Completa "${currentLesson.title}" para desbloquear "${nextLesson.title}"`
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/70 px-4 py-2 text-xs font-medium text-slate-400 dark:text-slate-500 cursor-not-allowed min-h-[42px]"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>
                            {nextLesson.module.id !== currentLesson.module.id
                              ? 'Siguiente módulo bloqueado'
                              : 'Siguiente capítulo bloqueado'}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void handleNavigateLesson(nextLesson.id, false)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-4 py-2 text-xs font-medium text-white dark:text-slate-900 hover:opacity-90 transition-opacity min-h-[42px]"
                        >
                          <span>{t('nextSubModule')}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {(isNextLessonLocked || lockWarning) && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        {lockWarning
                          ? lockWarning
                          : !isLessonDone
                            ? `Capítulo bloqueado: para desbloquear "${nextLesson?.title}", primero completa este capítulo ("${currentLesson.title}").`
                            : blockingLesson
                              ? `Para desbloquear "${nextLesson?.title}", primero completa el capítulo pendiente "${blockingLesson.title}".`
                              : `No puedes avanzar a "${nextLesson?.module.title}" sin terminar "${currentLesson.module.title}".`}
                      </span>
                    </div>
                    {blockingLesson && blockingLesson.id !== currentLesson.id && (
                      <button
                        type="button"
                        onClick={() => selectLesson(blockingLesson.id)}
                        className="rounded-md bg-amber-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-700 transition-colors shrink-0"
                      >
                        Ir a pendiente: {blockingLesson.title}
                      </button>
                    )}
                  </div>
                )}
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

        {/* Right Syllabus Tree (Module Explorer) */}
        {!zenMode && (
          <aside className="min-w-0 xl:sticky xl:top-20 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
            {/* Syllabus Search Header */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2.5">
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
              {lockWarning && (
                <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>{lockWarning}</span>
                </div>
              )}
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[700px] overflow-y-auto">
            {activeCourse.modules.map((mod, mIdx) => {
              const modDone = effectiveCompletedModuleIds.includes(mod.id);
              const doneInModule = mod.lessons.filter((l) =>
                completedLessonSet.has(l.id)
              ).length;
              const modPct = Math.round((doneInModule / (mod.lessons.length || 1)) * 100);
              const isModuleLocked = !isModuleUnlocked(mod.id);
              const blockingModule = isModuleLocked
                ? activeCourse.modules[moduleProgression.firstIncompleteModuleIndex] ??
                  activeCourse.modules[mIdx - 1]
                : null;

              const filteredLessons = mod.lessons.filter(
                (l) =>
                  !searchTopic ||
                  l.title.toLowerCase().includes(searchTopic.toLowerCase()) ||
                  l.summary.toLowerCase().includes(searchTopic.toLowerCase())
              );

              if (searchTopic && filteredLessons.length === 0) return null;

              const isExpanded = Boolean(searchTopic) || Boolean(expandedModules[mod.id]);

              return (
                <div
                  key={mod.id}
                  className={`p-4 space-y-2.5 ${isModuleLocked ? 'bg-slate-50/50 dark:bg-slate-900/30' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedModules((prev) => ({ ...prev, [mod.id]: !isExpanded }))
                    }
                    className="w-full text-left space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                            isExpanded ? 'rotate-0' : '-rotate-90'
                          }`}
                        />
                        {isModuleLocked && (
                          <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                        )}
                        <h4
                          className={`text-xs font-bold uppercase tracking-tight transition-colors ${
                            isModuleLocked
                              ? 'text-slate-500 dark:text-slate-400'
                              : 'text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                          }`}
                        >
                          {mod.title}
                        </h4>
                      </span>
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
                          modDone ? 'bg-emerald-600' : isModuleLocked ? 'bg-slate-300 dark:bg-slate-700' : 'bg-blue-600'
                        }`}
                        style={{ width: `${modPct}%` }}
                      />
                    </div>
                    {isModuleLocked && blockingModule && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-300/90 flex items-center gap-1 pt-0.5">
                        <Lock className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          Bloqueado · Completa {blockingModule.title}
                        </span>
                      </p>
                    )}
                  </button>
                  {isExpanded && (
                  <div className="space-y-1 pt-1">
                    {filteredLessons.map((lesson) => {
                      const done = completedLessonSet.has(lesson.id);
                      const active = currentLesson.id === lesson.id;
                      const lessonLocked = !isLessonUnlocked(lesson.id);
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          aria-disabled={lessonLocked}
                          onClick={() => selectLesson(lesson.id)}
                          title={
                            lessonLocked
                              ? isModuleLocked
                                ? `Completa ${blockingModule?.title ?? 'el módulo anterior'} para desbloquear este capítulo`
                                : `Completa "${blockingLesson?.title ?? 'el capítulo anterior'}" para desbloquear este capítulo`
                              : undefined
                          }
                          className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors min-h-[38px] ${
                            lessonLocked
                              ? 'text-slate-400 dark:text-slate-500 opacity-65 cursor-not-allowed hover:bg-amber-50/40 dark:hover:bg-amber-950/20'
                              : active
                                ? 'bg-blue-600 text-white font-medium shadow-xs'
                                : done
                                  ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            {lessonLocked ? (
                              <Lock className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                            ) : done ? (
                              <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                            ) : (
                              <Circle className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-blue-200' : 'text-slate-400'}`} />
                            )}
                            <span className="truncate">{lesson.title}</span>
                          </span>
                          <span className="flex items-center gap-1.5 shrink-0">
                            {lesson.id === 'les-excel-1-13' && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  lessonLocked
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                    : active
                                      ? 'bg-white/20 text-white'
                                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-[#107C41] dark:text-emerald-300'
                                }`}
                              >
                                3D
                              </span>
                            )}
                            <span className={`font-mono tabular-nums text-[10px] ${active && !lessonLocked ? 'text-blue-100' : 'text-slate-400'}`}>
                              {lesson.durationMinutes}m
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  )}
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
