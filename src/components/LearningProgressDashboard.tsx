import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  RotateCcw,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Certificate, Course, Enrollment, ThemeMode } from '../types';

export interface LearningProgressDashboardProps {
  courses: Course[];
  enrollments: Enrollment[];
  certificates: Certificate[];
  activeCourseId: string | null;
  previewCompletedByCourse?: Record<string, string[]>;
  theme: ThemeMode;
  onSelectCourse: (courseId: string) => void;
}

interface CourseAnalyticsRow {
  courseId: string;
  title: string;
  shortTitle: string;
  progressPercent: number;
  studyMinutes: number;
  estimatedMinutes: number;
  completedModules: number;
  totalModules: number;
  pendingModules: number;
  completedLessons: number;
  totalLessons: number;
  status: 'completed' | 'in_progress' | 'not_started';
  isActive: boolean;
}

interface ModuleAnalyticsRow {
  moduleId: string;
  shortName: string;
  fullTitle: string;
  completedLessons: number;
  totalLessons: number;
  completionPercent: number;
  completedMinutes: number;
  remainingMinutes: number;
  totalMinutes: number;
  isCompleted: boolean;
}

function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  if (safe < 60) return `${safe} min`;
  const hrs = Math.floor(safe / 60);
  const mins = safe % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function truncateLabel(text: string, maxLen = 20): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1).trimEnd()}…`;
}

interface CustomTooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
}

const ProgressBarTooltip: React.FC<{
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  isDark: boolean;
}> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload as unknown as CourseAnalyticsRow | undefined;
  if (!row) return null;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] px-3 py-2.5 text-xs shadow-lg max-w-[260px]">
      <p className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">
        {row.title}
      </p>
      <div className="mt-1.5 space-y-1 text-slate-600 dark:text-slate-300 font-mono tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="font-sans text-slate-500 dark:text-slate-400">Avance:</span>
          <span className="font-bold text-slate-900 dark:text-white">{row.progressPercent}%</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-sans text-slate-500 dark:text-slate-400">Lecciones:</span>
          <span>
            {row.completedLessons}/{row.totalLessons}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-sans text-slate-500 dark:text-slate-400">Módulos:</span>
          <span>
            {row.completedModules}/{row.totalModules}
          </span>
        </div>
      </div>
    </div>
  );
};

const TimeBarTooltip: React.FC<{
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  mode: 'courses' | 'modules';
}> = ({ active, payload, mode }) => {
  if (!active || !payload || payload.length === 0) return null;
  const raw = payload[0]?.payload;
  if (!raw) return null;

  if (mode === 'courses') {
    const row = raw as unknown as CourseAnalyticsRow;
    const ratio =
      row.estimatedMinutes > 0
        ? Math.min(100, Math.round((row.studyMinutes / row.estimatedMinutes) * 100))
        : 0;
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] px-3 py-2.5 text-xs shadow-lg max-w-[260px]">
        <p className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">
          {row.title}
        </p>
        <div className="mt-1.5 space-y-1 font-mono tabular-nums text-slate-600 dark:text-slate-300">
          <div className="flex items-center justify-between gap-4">
            <span className="font-sans text-cyan-600 dark:text-cyan-400 font-medium">Invertido:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {formatDuration(row.studyMinutes)} ({row.studyMinutes}m)
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-sans text-slate-500 dark:text-slate-400">Duración total:</span>
            <span>{formatDuration(row.estimatedMinutes)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-sans text-slate-500 dark:text-slate-400">Cobertura:</span>
            <span>{ratio}%</span>
          </div>
        </div>
      </div>
    );
  }

  const mod = raw as unknown as ModuleAnalyticsRow;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] px-3 py-2.5 text-xs shadow-lg max-w-[260px]">
      <p className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">
        {mod.fullTitle}
      </p>
      <div className="mt-1.5 space-y-1 font-mono tabular-nums text-slate-600 dark:text-slate-300">
        <div className="flex items-center justify-between gap-4">
          <span className="font-sans text-cyan-600 dark:text-cyan-400 font-medium">Completado:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {mod.completedMinutes} min
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-sans text-slate-500 dark:text-slate-400">Restante:</span>
          <span>{mod.remainingMinutes} min</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-sans text-slate-500 dark:text-slate-400">Lecciones:</span>
          <span>
            {mod.completedLessons}/{mod.totalLessons} ({mod.completionPercent}%)
          </span>
        </div>
      </div>
    </div>
  );
};

const ModuleDonutTooltip: React.FC<{
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
}> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  if (!item) return null;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] px-3 py-2 text-xs shadow-lg font-mono tabular-nums">
      <span className="font-sans font-semibold text-slate-900 dark:text-slate-100">
        {item.name}:
      </span>{' '}
      <span className="font-bold text-slate-900 dark:text-white">{item.value ?? 0} módulos</span>
    </div>
  );
};

export const LearningProgressDashboard: React.FC<LearningProgressDashboardProps> = ({
  courses,
  enrollments,
  certificates,
  activeCourseId,
  previewCompletedByCourse = {},
  theme,
  onSelectCourse,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [timeScope, setTimeScope] = useState<'courses' | 'modules'>('courses');
  const [moduleScope, setModuleScope] = useState<'all' | 'active'>('all');

  const isDark = theme === 'dark';

  const courseStats = useMemo<CourseAnalyticsRow[]>(() => {
    return courses.map((course) => {
      const enrollment = enrollments.find((e) => e.courseId === course.id);
      const previewLessons = previewCompletedByCourse[course.id] ?? [];
      const completedLessonSet = new Set([
        ...(enrollment?.completedLessonIds ?? []),
        ...previewLessons,
      ]);

      const totalLessons =
        course.modules.reduce((acc, m) => acc + m.lessons.length, 0) || course.totalLessons || 0;
      const completedLessons = course.modules.reduce(
        (acc, m) => acc + m.lessons.filter((l) => completedLessonSet.has(l.id)).length,
        0
      );

      const totalModules = course.modules.length;
      const completedModules = course.modules.filter(
        (m) => m.lessons.length > 0 && m.lessons.every((l) => completedLessonSet.has(l.id))
      ).length;
      const pendingModules = Math.max(0, totalModules - completedModules);

      const estimatedMinutes = course.modules.reduce((acc, m) => {
        const lessonsSum = m.lessons.reduce(
          (lAcc, l) => lAcc + (Number(l.durationMinutes) || 0),
          0
        );
        return acc + (lessonsSum > 0 ? lessonsSum : Number(m.durationMinutes) || 0);
      }, 0);

      const previewMinutes = course.modules.reduce((acc, m) => {
        return (
          acc +
          m.lessons.reduce(
            (lAcc, l) =>
              lAcc + (previewLessons.includes(l.id) ? Number(l.durationMinutes) || 15 : 0),
            0
          )
        );
      }, 0);

      const studyMinutes = (enrollment?.studyMinutes ?? 0) + previewMinutes;

      const computedProgress =
        totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
      const progressPercent =
        enrollment && previewLessons.length === 0
          ? enrollment.progressPercent
          : computedProgress;

      const status: CourseAnalyticsRow['status'] =
        progressPercent >= 100
          ? 'completed'
          : completedLessons > 0 || studyMinutes > 0
            ? 'in_progress'
            : 'not_started';

      return {
        courseId: course.id,
        title: course.title,
        shortTitle: truncateLabel(course.title.split(':')[0] || course.title, 20),
        progressPercent,
        studyMinutes,
        estimatedMinutes,
        completedModules,
        totalModules,
        pendingModules,
        completedLessons,
        totalLessons,
        status,
        isActive: course.id === activeCourseId,
      };
    });
  }, [courses, enrollments, previewCompletedByCourse, activeCourseId]);

  const filteredCourses = useMemo(() => {
    if (statusFilter === 'all') return courseStats;
    if (statusFilter === 'completed') return courseStats.filter((c) => c.status === 'completed');
    return courseStats.filter((c) => c.status !== 'completed');
  }, [courseStats, statusFilter]);

  const activeCourse = useMemo(
    () => courses.find((c) => c.id === activeCourseId) || courses[0] || null,
    [courses, activeCourseId]
  );

  const activeCourseModuleStats = useMemo<ModuleAnalyticsRow[]>(() => {
    if (!activeCourse) return [];
    const enrollment = enrollments.find((e) => e.courseId === activeCourse.id);
    const completedSet = new Set([
      ...(enrollment?.completedLessonIds ?? []),
      ...(previewCompletedByCourse[activeCourse.id] ?? []),
    ]);

    return activeCourse.modules.map((mod, idx) => {
      const totalLessons = mod.lessons.length;
      const completedLessons = mod.lessons.filter((l) => completedSet.has(l.id)).length;
      const completionPercent =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      const completedMinutes = mod.lessons.reduce(
        (acc, l) => acc + (completedSet.has(l.id) ? Number(l.durationMinutes) || 15 : 0),
        0
      );
      const totalLessonMinutes = mod.lessons.reduce(
        (acc, l) => acc + (Number(l.durationMinutes) || 15),
        0
      );
      const totalMinutes =
        totalLessonMinutes > 0 ? totalLessonMinutes : Number(mod.durationMinutes) || 0;
      const remainingMinutes = Math.max(0, totalMinutes - completedMinutes);

      return {
        moduleId: mod.id,
        shortName: `Mód. ${idx}`,
        fullTitle: mod.title,
        completedLessons,
        totalLessons,
        completionPercent,
        completedMinutes,
        remainingMinutes,
        totalMinutes,
        isCompleted: totalLessons > 0 && completedLessons === totalLessons,
      };
    });
  }, [activeCourse, enrollments, previewCompletedByCourse]);

  const totals = useMemo(() => {
    const totalCourses = courseStats.length;
    const completedCourses = courseStats.filter((c) => c.progressPercent >= 100).length;
    const avgProgress =
      totalCourses > 0
        ? Math.round(courseStats.reduce((acc, c) => acc + c.progressPercent, 0) / totalCourses)
        : 0;
    const totalStudyMinutes = courseStats.reduce((acc, c) => acc + c.studyMinutes, 0);
    const totalEstimatedMinutes = courseStats.reduce((acc, c) => acc + c.estimatedMinutes, 0);
    const totalCompletedModules = courseStats.reduce((acc, c) => acc + c.completedModules, 0);
    const totalModules = courseStats.reduce((acc, c) => acc + c.totalModules, 0);
    const totalCompletedLessons = courseStats.reduce((acc, c) => acc + c.completedLessons, 0);
    const totalLessons = courseStats.reduce((acc, c) => acc + c.totalLessons, 0);

    return {
      totalCourses,
      completedCourses,
      avgProgress,
      totalStudyMinutes,
      totalEstimatedMinutes,
      totalCompletedModules,
      totalModules,
      modulesPct:
        totalModules > 0 ? Math.round((totalCompletedModules / totalModules) * 100) : 0,
      totalCompletedLessons,
      totalLessons,
    };
  }, [courseStats]);

  const moduleDonutSummary = useMemo(() => {
    const activeStat = courseStats.find((c) => c.courseId === activeCourse?.id);
    const completed =
      moduleScope === 'active' && activeStat
        ? activeStat.completedModules
        : totals.totalCompletedModules;
    const total =
      moduleScope === 'active' && activeStat ? activeStat.totalModules : totals.totalModules;
    const pending = Math.max(0, total - completed);
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completed,
      pending,
      total,
      rate,
      scopeLabel:
        moduleScope === 'active' && activeStat ? activeStat.shortTitle : 'Todos los cursos',
      data:
        total > 0
          ? [
              { name: 'Completados', value: completed },
              { name: 'Pendientes', value: pending },
            ]
          : [{ name: 'Pendientes', value: 1 }],
    };
  }, [courseStats, activeCourse?.id, moduleScope, totals]);

  const axisTickColor = isDark ? '#94A3B8' : '#475569';
  const gridColor = isDark ? '#1E293B' : '#E2E8F0';
  const primaryBarColor = isDark ? '#3B82F6' : '#0052CC';
  const completedBarColor = isDark ? '#10B981' : '#047857';
  const idleBarColor = isDark ? '#475569' : '#94A3B8';
  const studyTimeColor = isDark ? '#06B6D4' : '#0891B2';
  const estimatedTrackColor = isDark ? '#1E293B' : '#CBD5E1';

  return (
    <section
      aria-label="Dashboard de progreso del estudiante"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] overflow-hidden"
    >
      {/* Top Toolbar */}
      <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#0052CC] dark:text-cyan-400 shrink-0" />
            <h2 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Dashboard de Mi Aprendizaje
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {totals.totalCourses} cursos · {totals.totalCompletedModules}/{totals.totalModules} módulos ·{' '}
            {formatDuration(totals.totalStudyMinutes)} invertidos
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#070E1D] border border-slate-200 dark:border-slate-800 self-start md:self-auto shrink-0">
          {(
            [
              { id: 'all', label: `Todos (${courseStats.length})` },
              {
                id: 'in_progress',
                label: `Activos (${courseStats.filter((c) => c.status !== 'completed').length})`,
              },
              {
                id: 'completed',
                label: `Completados (${totals.completedCourses})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[32px] ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-[#17233B] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0B1426]/60">
        <div className="px-4 py-3.5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Avance promedio</p>
          <p className="mt-1 font-display text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {totals.avgProgress}%
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {totals.completedCourses} de {totals.totalCourses} cursos al 100%
          </p>
        </div>

        <div className="px-4 py-3.5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tiempo invertido</p>
          <p className="mt-1 font-display text-2xl font-bold font-mono tabular-nums text-[#0891B2] dark:text-cyan-400">
            {formatDuration(totals.totalStudyMinutes)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {totals.totalStudyMinutes} min de {formatDuration(totals.totalEstimatedMinutes)} est.
          </p>
        </div>

        <div className="px-4 py-3.5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Módulos completados</p>
          <p className="mt-1 font-display text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
            {totals.totalCompletedModules}
            <span className="text-sm font-normal text-slate-400"> / {totals.totalModules}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {totals.modulesPct}% de módulos aprobados
          </p>
        </div>

        <div className="px-4 py-3.5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Lecciones y diplomas</p>
          <p className="mt-1 font-display text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {totals.totalCompletedLessons}
            <span className="text-sm font-normal text-slate-400"> / {totals.totalLessons}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {certificates.length} certificado{certificates.length === 1 ? '' : 's'} emitido
            {certificates.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Main Charts Section */}
      {filteredCourses.length === 0 ? (
        <div className="p-8 text-center space-y-3">
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No hay cursos en este filtro
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cambia el filtro superior para visualizar tus cursos inscritos y sus gráficos de progreso.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ver todos los cursos</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
            {/* Chart 1: Avance Porcentual por Curso (5 cols) */}
            <div className="lg:col-span-5 p-4 space-y-3 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Avance porcentual por curso
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Haz clic en una barra para abrir el curso
                  </p>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                  Meta: 100%
                </span>
              </div>

              <div className="w-full h-[220px] min-w-0">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={filteredCourses}
                    layout="vertical"
                    margin={{ top: 4, right: 18, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fill: axisTickColor, fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: gridColor }}
                      unit="%"
                    />
                    <YAxis
                      type="category"
                      dataKey="shortTitle"
                      width={118}
                      tick={{ fill: axisTickColor, fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ReferenceLine x={100} stroke={completedBarColor} strokeDasharray="3 3" />
                    <Tooltip
                      cursor={{ fill: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.04)' }}
                      content={<ProgressBarTooltip isDark={isDark} />}
                    />
                    <Bar
                      dataKey="progressPercent"
                      barSize={22}
                      radius={[0, 6, 6, 0]}
                      className="cursor-pointer"
                      onClick={(barData) => {
                        const payload = barData as unknown as CourseAnalyticsRow | undefined;
                        if (payload?.courseId) {
                          onSelectCourse(payload.courseId);
                        }
                      }}
                    >
                      {filteredCourses.map((entry) => (
                        <Cell
                          key={entry.courseId}
                          fill={
                            entry.progressPercent >= 100
                              ? completedBarColor
                              : entry.progressPercent > 0
                                ? primaryBarColor
                                : idleBarColor
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Tiempo Invertido (4 cols) */}
            <div className="lg:col-span-4 p-4 space-y-3 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Tiempo invertido (min)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {timeScope === 'courses'
                      ? 'Minutos invertidos vs duración total'
                      : `Por módulo · ${truncateLabel(activeCourse?.title.split(':')[0] || '', 24)}`}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-slate-100 dark:bg-[#070E1D] border border-slate-200 dark:border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setTimeScope('courses')}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                      timeScope === 'courses'
                        ? 'bg-white dark:bg-[#17233B] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Por curso
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeScope('modules')}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                      timeScope === 'modules'
                        ? 'bg-white dark:bg-[#17233B] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Por módulo
                  </button>
                </div>
              </div>

              <div className="w-full h-[220px] min-w-0">
                <ResponsiveContainer width="100%" height={220}>
                  {timeScope === 'courses' ? (
                    <BarChart
                      data={filteredCourses}
                      margin={{ top: 6, right: 8, left: -12, bottom: 4 }}
                    >
                      <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="shortTitle"
                        tick={{ fill: axisTickColor, fontSize: 10 }}
                        tickLine={false}
                        axisLine={{ stroke: gridColor }}
                        interval={0}
                        tickFormatter={(val: string) => truncateLabel(val, 13)}
                      />
                      <YAxis
                        tick={{ fill: axisTickColor, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        unit="m"
                      />
                      <Tooltip
                        cursor={{ fill: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.04)' }}
                        content={<TimeBarTooltip mode="courses" />}
                      />
                      <Bar
                        dataKey="studyMinutes"
                        name="Invertido"
                        fill={studyTimeColor}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={26}
                      />
                      <Bar
                        dataKey="estimatedMinutes"
                        name="Estimado"
                        fill={estimatedTrackColor}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={26}
                      />
                    </BarChart>
                  ) : (
                    <BarChart
                      data={activeCourseModuleStats}
                      margin={{ top: 6, right: 8, left: -12, bottom: 4 }}
                    >
                      <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="shortName"
                        tick={{ fill: axisTickColor, fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: gridColor }}
                      />
                      <YAxis
                        tick={{ fill: axisTickColor, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        unit="m"
                      />
                      <Tooltip
                        cursor={{ fill: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.04)' }}
                        content={<TimeBarTooltip mode="modules" />}
                      />
                      <Bar
                        dataKey="completedMinutes"
                        stackId="modTime"
                        name="Completado"
                        fill={studyTimeColor}
                        radius={[0, 0, 0, 0]}
                        maxBarSize={32}
                      />
                      <Bar
                        dataKey="remainingMinutes"
                        stackId="modTime"
                        name="Restante"
                        fill={estimatedTrackColor}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Módulos Completados Donut (3 cols) */}
            <div className="lg:col-span-3 p-4 space-y-3 min-w-0 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Módulos completados
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {moduleDonutSummary.scopeLabel}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-slate-100 dark:bg-[#070E1D] border border-slate-200 dark:border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setModuleScope('all')}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      moduleScope === 'all'
                        ? 'bg-white dark:bg-[#17233B] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Global
                  </button>
                  <button
                    type="button"
                    onClick={() => setModuleScope('active')}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      moduleScope === 'active'
                        ? 'bg-white dark:bg-[#17233B] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Activo
                  </button>
                </div>
              </div>

              <div className="relative w-full h-[160px] min-w-0">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={moduleDonutSummary.data}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={66}
                      paddingAngle={moduleDonutSummary.total > 0 ? 3 : 0}
                      stroke="none"
                    >
                      {moduleDonutSummary.data.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            entry.name === 'Completados' && moduleDonutSummary.completed > 0
                              ? completedBarColor
                              : estimatedTrackColor
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ModuleDonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {moduleDonutSummary.completed}/{moduleDonutSummary.total}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {moduleDonutSummary.rate}% listos
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Completados</span>
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                    {moduleDonutSummary.completed}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Pendientes</span>
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                    {moduleDonutSummary.pending}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Course Breakdown Table */}
          <div className="border-t border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0B1426]/40 text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-4 font-semibold">Curso</th>
                  <th className="py-2.5 px-3 font-semibold">Avance</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Módulos</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Tiempo invertido</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredCourses.map((row) => (
                  <tr
                    key={row.courseId}
                    onClick={() => onSelectCourse(row.courseId)}
                    className={`cursor-pointer transition-colors ${
                      row.isActive
                        ? 'bg-blue-50/60 dark:bg-blue-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-slate-100 max-w-[260px]">
                      <span className="block truncate">{row.title}</span>
                    </td>
                    <td className="py-2.5 px-3 min-w-[140px]">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              row.progressPercent >= 100
                                ? 'bg-emerald-600 dark:bg-emerald-500'
                                : 'bg-[#0052CC] dark:bg-blue-500'
                            }`}
                            style={{ width: `${row.progressPercent}%` }}
                          />
                        </div>
                        <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100 w-9 text-right">
                          {row.progressPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {row.completedModules}/{row.totalModules}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {formatDuration(row.studyMinutes)}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      {row.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completado</span>
                        </span>
                      ) : row.status === 'in_progress' ? (
                        <span className="inline-flex items-center gap-1 font-medium text-[#0052CC] dark:text-blue-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>En progreso</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Sin iniciar</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};