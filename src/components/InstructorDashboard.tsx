import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileDown,
  FileSpreadsheet,
  Image as ImageIcon,
  Layers,
  Loader2,
  Paperclip,
  Pencil,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import type { Course, CourseLesson, CourseModule } from '../types';
import { exportTableToPdf, exportToCsv } from '../utils/export';
import { AuthGateNotice } from './AuthGateNotice';
import { ExerciseCreatorModal } from './ExerciseCreatorModal';
import { MaterialUploader } from './MaterialUploader';

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

function createEmptyLesson(index: number): CourseLesson {
  return {
    id: `les_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    title: `Lección ${index}`,
    durationMinutes: 15,
    summary: 'Resumen breve de la lección.',
    content: 'Contenido teórico y pasos prácticos de la lección.',
    materials: [],
  };
}

function createEmptyModule(index: number): CourseModule {
  return {
    id: `mod_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    title: `Módulo ${index}`,
    durationMinutes: 45,
    quizQuestion: `¿Cuál es el objetivo principal del Módulo ${index}?`,
    quizOptions: [
      'Dominar la implementación práctica en producción',
      'Memorizar definiciones sin aplicación',
      'Omitir las pruebas de validación',
    ],
    quizCorrectIndex: 0,
    lessons: [createEmptyLesson(1)],
  };
}

function cloneCourseModules(modules: CourseModule[]): CourseModule[] {
  return modules.map((m) => ({
    ...m,
    quizOptions: [...(m.quizOptions || ['', '', ''])],
    lessons: (m.lessons || []).map((l) => ({
      ...l,
      materials: (l.materials || []).map((mat) => ({ ...mat })),
    })),
  }));
}

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

  const [searchStudent, setSearchStudent] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [showExerciseCreator, setShowExerciseCreator] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Productividad');
  const [level, setLevel] = useState<Course['level']>('beginner');
  const [priceUsd, setPriceUsd] = useState('49');
  const [currency, setCurrency] = useState<Course['currency']>('USD');
  const [published, setPublished] = useState(true);
  const [modulesState, setModulesState] = useState<CourseModule[]>([createEmptyModule(1)]);
  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({});
  const [expandedLessonIds, setExpandedLessonIds] = useState<Record<string, boolean>>({});
  const [coverImage, setCoverImage] = useState('');
  const [generatingCover, setGeneratingCover] = useState(false);
  const [coverError, setCoverError] = useState('');
  const [creating, setCreating] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [draftCourseId] = useState(() => `crs_${Date.now().toString(36)}`);

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

  const requestGeneratedCover = async (targetTitle?: string): Promise<string> => {
    setGeneratingCover(true);
    setCoverError('');
    try {
      const res = await fetch('/api/v1/courses/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: (targetTitle ?? title).trim() || 'Curso DB Academy',
          category,
          level,
        }),
      });
      if (!res.ok) throw new Error('No se pudo generar la portada');
      const data = (await res.json()) as { coverImage?: string };
      if (data.coverImage) {
        setCoverImage(data.coverImage);
        return data.coverImage;
      }
      throw new Error('Respuesta sin imagen');
    } catch {
      const fallback = STUDIO_COVER_PRESETS[0].url;
      setCoverError('Modo sin conexión: se asignó una portada de respaldo.');
      setCoverImage(fallback);
      return fallback;
    } finally {
      setGeneratingCover(false);
    }
  };

  const handleStartNew = () => {
    const initialMod = createEmptyModule(1);
    setEditingCourse(null);
    setTitle('');
    setSubtitle('');
    setDescription('');
    setCategory('Productividad');
    setLevel('beginner');
    setPriceUsd('49');
    setCurrency('USD');
    setPublished(true);
    setCoverImage('');
    setCoverError('');
    setSaveError('');
    setSaveSuccess('');
    setModulesState([initialMod]);
    setExpandedModuleIds({ [initialMod.id]: true });
    setExpandedLessonIds({ [initialMod.lessons[0].id]: true });
    setShowBuilder(true);
  };

  const handleStartEdit = (course: Course) => {
    const clonedModules =
      course.modules && course.modules.length > 0
        ? cloneCourseModules(course.modules)
        : [createEmptyModule(1)];

    // Expand all modules so admin sees every module & lesson immediately
    const modOpen: Record<string, boolean> = {};
    clonedModules.forEach((m) => {
      modOpen[m.id] = true;
    });
    const firstLessonId = clonedModules[0]?.lessons[0]?.id;

    setEditingCourse(course);
    setTitle(course.title);
    setSubtitle(course.subtitle || '');
    setDescription(course.description || '');
    setCategory(course.category || 'Productividad');
    setLevel(course.level || 'beginner');
    setPriceUsd((course.priceCents / 100).toString());
    setCurrency(course.currency || 'USD');
    setPublished(course.published);
    setCoverImage(course.coverImage || '');
    setCoverError('');
    setSaveError('');
    setSaveSuccess('');
    setModulesState(clonedModules);
    setExpandedModuleIds(modOpen);
    setExpandedLessonIds(firstLessonId ? { [firstLessonId]: true } : {});
    setShowBuilder(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelBuilder = () => {
    setShowBuilder(false);
    setEditingCourse(null);
    setSaveError('');
  };

  const updateModuleField = (moduleId: string, patch: Partial<CourseModule>) => {
    setModulesState((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, ...patch } : m))
    );
  };

  const updateLessonField = (
    moduleId: string,
    lessonId: string,
    patch: Partial<CourseLesson>
  ) => {
    setModulesState((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        return {
          ...m,
          lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, ...patch } : l)),
        };
      })
    );
  };

  const handleAddModule = () => {
    if (modulesState.length >= 12) return;
    const nextMod = createEmptyModule(modulesState.length + 1);
    setModulesState((prev) => [...prev, nextMod]);
    setExpandedModuleIds((prev) => ({ ...prev, [nextMod.id]: true }));
    setExpandedLessonIds((prev) => ({ ...prev, [nextMod.lessons[0].id]: true }));
  };

  const handleRemoveModule = (moduleId: string) => {
    if (modulesState.length <= 1) return;
    setModulesState((prev) => prev.filter((m) => m.id !== moduleId));
  };

  const handleAddLesson = (moduleId: string) => {
    const mod = modulesState.find((m) => m.id === moduleId);
    const nextIdx = (mod?.lessons.length ?? 0) + 1;
    const nextLesson = createEmptyLesson(nextIdx);
    setModulesState((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, lessons: [...m.lessons, nextLesson] } : m
      )
    );
    setExpandedModuleIds((prev) => ({ ...prev, [moduleId]: true }));
    setExpandedLessonIds((prev) => ({ ...prev, [nextLesson.id]: true }));
  };

  const handleRemoveLesson = (moduleId: string, lessonId: string) => {
    setModulesState((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId || m.lessons.length <= 1) return m;
        return { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) };
      })
    );
  };

  const handlePublishCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');
    setCreating(true);
    try {
      const resolvedCover = coverImage || (await requestGeneratedCover(title));
      const priceCents = Math.max(0, Math.round(Number(priceUsd || 0) * 100));
      const cleanDescription =
        description.trim().length >= 10
          ? description.trim()
          : `${subtitle.trim()} — Programa de formación técnica en tiempo real.`;

      const normalizedModules = modulesState.map((m) => ({
        ...m,
        durationMinutes: m.lessons.reduce((acc, l) => acc + (Number(l.durationMinutes) || 10), 0),
      }));
      const totalLessonsCount = normalizedModules.reduce(
        (acc, m) => acc + m.lessons.length,
        0
      );

      if (editingCourse) {
        await updateCourse(editingCourse.id, {
          title: title.trim(),
          subtitle: subtitle.trim(),
          description: cleanDescription,
          category: category.trim() || 'Productividad',
          level,
          priceCents,
          currency,
          coverImage: resolvedCover,
          published,
          modulesCount: normalizedModules.length,
          totalLessons: totalLessonsCount,
          modules: normalizedModules,
        });
        setSaveSuccess(`Curso "${title.trim()}" actualizado con ${normalizedModules.length} módulos y ${totalLessonsCount} lecciones.`);
      } else {
        await createCourse({
          title: title.trim(),
          subtitle: subtitle.trim(),
          description: cleanDescription,
          category: category.trim() || 'Productividad',
          level,
          priceCents,
          currency,
          coverImage: resolvedCover,
          published,
          modulesCount: normalizedModules.length,
          totalLessons: totalLessonsCount,
          modules: normalizedModules,
        });
        setSaveSuccess(`Curso "${title.trim()}" publicado correctamente.`);
      }

      setShowBuilder(false);
      setEditingCourse(null);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar el curso. Verifica tus permisos de administrador.'
      );
    } finally {
      setCreating(false);
    }
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

  const totalBuilderLessons = modulesState.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('instructorTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {courses.length} programas en plataforma · {isAdmin ? 'Acceso completo de Administrador' : 'Panel de instructor'}
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

      {/* Full Curriculum Course Builder / Editor */}
      {showBuilder && (
        <form
          onSubmit={(e) => void handlePublishCourse(e)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-6"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {editingCourse ? (
                  <>
                    <Pencil className="w-4 h-4 text-amber-500" />
                    <span>Editar curso completo: {editingCourse.title}</span>
                  </>
                ) : (
                  <span>{t('courseBuilderTitle')}</span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {modulesState.length} módulos · {totalBuilderLessons} lecciones editables con temario y archivos adjuntos
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelBuilder}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {saveError && (
            <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Metadata & Cover */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Título del curso
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={140}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título del curso"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Subtítulo breve
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={240}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Subtítulo breve"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={60}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Categoría (ej. Productividad, Datos)"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Nivel, precio y moneda
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value as Course['level'])}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="beginner">{t('beginner')}</option>
                      <option value="intermediate">{t('intermediate')}</option>
                      <option value="advanced">{t('advanced')}</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={priceUsd}
                      onChange={(e) => setPriceUsd(e.target.value)}
                      placeholder="Precio"
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100"
                    />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as Course['currency'])}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="MXN">MXN</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Descripción académica del curso
                </label>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción académica del programa (mínimo 10 caracteres)"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <label className="inline-flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="rounded accent-blue-600 w-4 h-4"
                />
                <span>Publicado en el catálogo público (si se desmarca queda como borrador solo visible para Administrador)</span>
              </label>
            </div>

            {/* Cover Image Generator & Preview */}
            <div className="lg:col-span-5 space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {t('coverPlaceholderLabel')}
                </span>
                <button
                  type="button"
                  disabled={generatingCover}
                  onClick={() => void requestGeneratedCover()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3 py-1.5 text-xs font-medium text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-60 transition-opacity whitespace-nowrap shrink-0"
                >
                  {generatingCover ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{generatingCover ? t('generatingCover') : t('generateCover')}</span>
                </button>
              </div>

              <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 flex items-center justify-center">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={title || 'Vista previa de portada'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 px-4 text-center text-slate-400">
                    <ImageIcon className="w-7 h-7 opacity-75" />
                    <span className="text-[11px] leading-snug">
                      Se generará automáticamente al publicar o pulsa &ldquo;{t('generateCover')}&rdquo;
                    </span>
                  </div>
                )}
              </div>

              {coverError && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">{coverError}</p>
              )}

              <div className="space-y-1.5">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  O selecciona una portada de estudio:
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {STUDIO_COVER_PRESETS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      title={preset.label}
                      onClick={() => {
                        setCoverImage(preset.url);
                        setCoverError('');
                      }}
                      className={`aspect-video rounded overflow-hidden border transition-all ${
                        coverImage === preset.url
                          ? 'border-blue-600 ring-2 ring-blue-600/40'
                          : 'border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Complete Curriculum Editor (ALL Modules, ALL Lessons, Quizzes & Materials) */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Temario Completo y Materiales ({modulesState.length} módulos · {totalBuilderLessons} lecciones)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Expande cualquier módulo o lección para editar su texto, evaluación y archivos descargables.
                </p>
              </div>
              <button
                type="button"
                disabled={modulesState.length >= 12}
                onClick={handleAddModule}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/60 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar módulo</span>
              </button>
            </div>

            <div className="space-y-3">
              {modulesState.map((mod, modIdx) => {
                const modOpen = Boolean(expandedModuleIds[mod.id]);
                const modMaterialsCount = mod.lessons.reduce(
                  (acc, l) => acc + (l.materials?.length ?? 0),
                  0
                );

                return (
                  <div
                    key={mod.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 overflow-hidden"
                  >
                    {/* Module Header */}
                    <div className="px-4 py-3 bg-slate-100/80 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedModuleIds((prev) => ({
                            ...prev,
                            [mod.id]: !prev[mod.id],
                          }))
                        }
                        className="flex items-center gap-2 text-left min-w-0 flex-1"
                      >
                        {modOpen ? (
                          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          Módulo {modIdx + 1}: {mod.title}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                          ({mod.lessons.length} lecciones · {modMaterialsCount} materiales)
                        </span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAddLesson(mod.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Lección</span>
                        </button>
                        {modulesState.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveModule(mod.id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Eliminar módulo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {modOpen && (
                      <div className="p-4 space-y-4">
                        {/* Module metadata + quiz */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-3.5">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                              Título del módulo
                            </label>
                            <input
                              type="text"
                              required
                              value={mod.title}
                              onChange={(e) =>
                                updateModuleField(mod.id, { title: e.target.value })
                              }
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                              Pregunta de evaluación del módulo
                            </label>
                            <input
                              type="text"
                              value={mod.quizQuestion}
                              onChange={(e) =>
                                updateModuleField(mod.id, { quizQuestion: e.target.value })
                              }
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {(mod.quizOptions || ['', '', '']).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-1.5">
                                <input
                                  type="radio"
                                  name={`quiz-correct-${mod.id}`}
                                  checked={mod.quizCorrectIndex === optIdx}
                                  onChange={() =>
                                    updateModuleField(mod.id, { quizCorrectIndex: optIdx })
                                  }
                                  title="Marcar como respuesta correcta"
                                  className="accent-emerald-600"
                                />
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const nextOpts = [...(mod.quizOptions || ['', '', ''])];
                                    nextOpts[optIdx] = e.target.value;
                                    updateModuleField(mod.id, { quizOptions: nextOpts });
                                  }}
                                  placeholder={`Opción ${optIdx + 1}`}
                                  className="flex-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* All Lessons inside this Module */}
                        <div className="space-y-2">
                          {mod.lessons.map((lesson, lessonIdx) => {
                            const lessonOpen = Boolean(expandedLessonIds[lesson.id]);
                            const matCount = lesson.materials?.length ?? 0;

                            return (
                              <div
                                key={lesson.id}
                                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden"
                              >
                                <div className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedLessonIds((prev) => ({
                                        ...prev,
                                        [lesson.id]: !prev[lesson.id],
                                      }))
                                    }
                                    className="flex items-center gap-2 text-left min-w-0 flex-1"
                                  >
                                    {lessonOpen ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    )}
                                    <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                                      {lessonIdx + 1}. {lesson.title}
                                    </span>
                                  </button>

                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                                    <span className="font-mono tabular-nums">
                                      {lesson.durationMinutes} min
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                      <Paperclip className="w-3 h-3" />
                                      <span>{matCount}</span>
                                    </span>
                                    {mod.lessons.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveLesson(mod.id, lesson.id)}
                                        className="p-1 rounded text-slate-400 hover:text-red-600"
                                        title="Eliminar lección"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {lessonOpen && (
                                  <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/40 dark:bg-slate-900/20">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                      <div className="md:col-span-3">
                                        <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                                          Título de la lección
                                        </label>
                                        <input
                                          type="text"
                                          required
                                          value={lesson.title}
                                          onChange={(e) =>
                                            updateLessonField(mod.id, lesson.id, {
                                              title: e.target.value,
                                            })
                                          }
                                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                                          Duración (min)
                                        </label>
                                        <input
                                          type="number"
                                          min="1"
                                          max="240"
                                          value={lesson.durationMinutes}
                                          onChange={(e) =>
                                            updateLessonField(mod.id, lesson.id, {
                                              durationMinutes: Number(e.target.value) || 10,
                                            })
                                          }
                                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                                        Objetivo de competencia / Resumen
                                      </label>
                                      <input
                                        type="text"
                                        value={lesson.summary}
                                        onChange={(e) =>
                                          updateLessonField(mod.id, lesson.id, {
                                            summary: e.target.value,
                                          })
                                        }
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                                        Contenido completo de la lección
                                      </label>
                                      <textarea
                                        rows={4}
                                        value={lesson.content}
                                        onChange={(e) =>
                                          updateLessonField(mod.id, lesson.id, {
                                            content: e.target.value,
                                          })
                                        }
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs leading-relaxed text-slate-900 dark:text-slate-100"
                                      />
                                    </div>

                                    <MaterialUploader
                                      courseId={editingCourse?.id ?? draftCourseId}
                                      lessonId={lesson.id}
                                      lessonTitle={lesson.title || `Lección ${lessonIdx + 1}`}
                                      materials={lesson.materials ?? []}
                                      onChange={(updated) =>
                                        updateLessonField(mod.id, lesson.id, {
                                          materials: updated,
                                        })
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleCancelBuilder}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating || generatingCover}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors min-h-[42px]"
            >
              {(creating || generatingCover) && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              <span>{editingCourse ? 'Guardar todos los cambios' : t('publishCourse')}</span>
            </button>
          </div>
        </form>
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
                    onClick={() => setCourseToDelete(course)}
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
                  Esta acción eliminará permanentemente el programa de la plataforma.
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

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setCourseToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await deleteCourse(courseToDelete.id);
                    setCourseToDelete(null);
                  } finally {
                    setDeleting(false);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-colors min-h-[38px]"
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
    </div>
  );
};
