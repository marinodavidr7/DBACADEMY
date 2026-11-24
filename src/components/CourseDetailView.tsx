import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Box,
  CheckCircle2,
  ChevronDown,
  Clock,
  Gift,
  Layers,
  Lock,
  Pencil,
  Play,
  ShieldCheck,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import type { Course } from '../types';
import { formatCurrency } from '../utils/currency';
import { CheckoutModal } from './CheckoutModal';
import { RedeemGiftCardModal } from './RedeemGiftCardModal';
import { CourseProgressBar } from './ui/CourseProgressBar';

export const CourseDetailView: React.FC = () => {
  const {
    user,
    isAdmin,
    courses,
    enrollments,
    certificates,
    selectedCourseId,
    setSelectedCourseId,
    setActiveView,
    enrollWithPayment,
    t,
  } = usePlatform();

  const course = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || courses[0] || null;
  }, [courses, selectedCourseId]);

  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(
    () => course?.modules[0]?.id ?? null
  );

  useEffect(() => {
    setExpandedModuleId(course?.modules[0]?.id ?? null);
  }, [course?.id]);
  const [checkoutCourse, setCheckoutCourse] = useState<Course | null>(null);
  const [checkoutGiftCardCode, setCheckoutGiftCardCode] = useState('');
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  if (!course) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-8 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Selecciona un curso del catálogo para consultar su programa completo.
        </p>
        <button
          type="button"
          onClick={() => setActiveView('catalog')}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0052CC] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0747A6] min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al catálogo</span>
        </button>
      </div>
    );
  }

  const enrollment = enrollments.find((e) => e.courseId === course.id);
  const isEnrolled = Boolean(enrollment);
  const hasInstructorAccess = isAdmin;
  const isExcelCourse = course.id === 'excel-basico-05' || /excel/i.test(course.title);

  const prereqCourses = useMemo(() => {
    if (!course?.prerequisites || course.prerequisites.length === 0) return [];
    return courses.filter((c) => course.prerequisites?.includes(c.id));
  }, [course, courses]);

  const prereqsMet = useMemo(() => {
    if (prereqCourses.length === 0) return true;
    if (isAdmin) return true;
    return prereqCourses.every((p) => {
      const enr = enrollments.find((e) => e.courseId === p.id);
      const hasCert = certificates.some((c) => c.courseId === p.id);
      return (enr && enr.progressPercent >= 100) || hasCert;
    });
  }, [prereqCourses, enrollments, certificates, isAdmin]);

  const totalMinutes = course.modules.reduce((acc, m) => acc + (m.durationMinutes || 0), 0);
  const totalHours = Math.max(1, Math.round((totalMinutes / 60) * 10) / 10);

  const levelLabel = (lvl: Course['level']) => {
    if (lvl === 'beginner') return t('beginner');
    if (lvl === 'intermediate') return t('intermediate');
    return t('advanced');
  };

  const formatPrice = (cents: number, currency: Course['currency']) => {
    if (cents === 0) return 'Gratis';
    return formatCurrency(cents, currency);
  };

  const handlePrimaryAction = async () => {
    if (prereqCourses.length > 0 && !prereqsMet && !isAdmin) {
      if (prereqCourses[0]) {
        setSelectedCourseId(prereqCourses[0].id);
      }
      return;
    }
    if (isEnrolled || hasInstructorAccess) {
      setSelectedCourseId(course.id);
      setActiveView('learning');
      return;
    }
    if (course.priceCents === 0) {
      setEnrolling(true);
      try {
        await enrollWithPayment(course, 'free');
        setSelectedCourseId(course.id);
        setActiveView('learning');
      } finally {
        setEnrolling(false);
      }
      return;
    }
    setCheckoutCourse(course);
  };

  return (
    <div className="space-y-5">
      {/* Dark Brand Course Header */}
      <section className="rounded-xl bg-[var(--dba-bg-hero)] text-zinc-100 border border-zinc-800/90 p-5 sm:p-6">
        <button
          type="button"
          onClick={() => setActiveView('catalog')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 transition-colors min-h-[36px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al catálogo</span>
        </button>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
          <span className="font-semibold text-amber-300">{course.category}</span>
          <span aria-hidden="true">·</span>
          <span>{levelLabel(course.level)}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {course.modules.length} {t('modulesLabel')}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {course.totalLessons} {t('lessonsLabel')}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{totalHours} h estimadas</span>
        </div>

        <h1 className="mt-3 font-display text-3xl lg:text-4xl 2xl:text-5xl font-bold tracking-tight text-white leading-tight max-w-[70ch] text-balance">
          {course.title}
        </h1>
        <p className="mt-3 text-sm sm:text-base 2xl:text-lg text-slate-300 leading-relaxed max-w-[70ch]">
          {course.subtitle}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-300">
          <span>
            Instructor: <strong className="text-white">{course.instructorName}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>Certificación verificable SHA-256 al completar el 100%</span>
        </div>
      </section>

      {/* Main Content + Sticky Enrollment Card */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
        <div className="min-w-0 space-y-5">
          {/* Prerrequisitos de la ruta formativa */}
          {prereqCourses.length > 0 && (
            prereqsMet ? (
              <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 sm:p-5 flex items-start gap-3.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-200">
                    {isAdmin ? 'Acceso de Administrador (Sin restricciones)' : 'Prerrequisitos aprobados'}
                  </p>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300/80 leading-relaxed">
                    {isAdmin
                      ? 'Como administrador tienes acceso total e irrestricto a este programa, todos sus módulos y contenidos sin bloqueos.'
                      : `Has completado con éxito ${prereqCourses.map((p) => p.title).join(', ')}. Cuentas con la base sólida recomendada para avanzar en este nivel.`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/90 dark:bg-amber-950/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-amber-950 dark:text-amber-200">
                      Prerrequisito obligatorio: Acceso bloqueado
                    </p>
                    <p className="text-xs text-amber-900/90 dark:text-amber-300/90 leading-relaxed max-w-xl">
                      Para cursar este programa debes haber completado y aprobado primero el 100% de:{' '}
                      <strong>{prereqCourses.map((p) => p.title).join(', ')}</strong>.
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
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap self-start sm:self-auto min-h-[38px]"
                >
                  <span>Ir a {prereqCourses[0]?.title.split(':')[0] || 'curso previo'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          )}

          {/* Descripción y Enfoque */}
          <section className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-5 space-y-3.5">
            <h2 className="font-display text-xl 2xl:text-2xl font-bold text-[var(--dba-text-primary)]">
              Acerca del programa
            </h2>
            <p className="text-sm 2xl:text-base leading-relaxed text-[var(--dba-text-secondary)] max-w-[70ch]">
              {course.description}
            </p>

            <div className="pt-4 border-t border-[var(--dba-border)] grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
              {course.modules.map((mod, idx) => (
                <div key={mod.id} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[var(--dba-text-primary)]">
                      0{idx + 1}. {mod.title}
                    </p>
                    <p className="text-xs text-[var(--dba-text-secondary)] tabular-nums">
                      {mod.lessons.length} lecciones · {mod.durationMinutes} min
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Temario Detallado */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-bold text-[var(--dba-text-primary)]">
                Plan de estudios ({course.totalLessons} lecciones)
              </h2>
              <span className="text-xs font-mono tabular-nums text-[var(--dba-text-secondary)]">
                {course.modules.length} módulos
              </span>
            </div>

            <div className="divide-y divide-[var(--dba-border)] rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] overflow-hidden">
              {course.modules.map((mod, modIdx) => {
                const isOpen = expandedModuleId === mod.id;
                return (
                  <div key={mod.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedModuleId(isOpen ? null : mod.id)}
                      aria-expanded={isOpen}
                      className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-stone-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-[var(--dba-accent-ink)] font-semibold">
                          Módulo {modIdx}
                        </p>
                        <h3 className="text-sm sm:text-base font-semibold text-[var(--dba-text-primary)] mt-0.5">
                          {mod.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="hidden sm:inline text-xs font-mono tabular-nums text-[var(--dba-text-secondary)]">
                          {mod.lessons.length} lecciones · {mod.durationMinutes} min
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-zinc-400 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-5 py-3 grid grid-cols-1 2xl:grid-cols-2 gap-x-6">
                        {mod.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="py-3 flex items-start justify-between gap-3 text-xs border-b border-slate-200/70 dark:border-slate-800/70 last:border-b-0"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 dark:text-slate-200">
                                {lesson.title}
                              </p>
                              <p className="mt-0.5 text-slate-500 dark:text-slate-400 line-clamp-1">
                                {lesson.summary}
                              </p>
                            </div>
                            <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                              {lesson.durationMinutes} min
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sticky Sidebar Card */}
        <aside className="xl:sticky xl:top-20 rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] overflow-hidden">
          <div className="w-full aspect-[16/10] bg-zinc-900 relative overflow-hidden">
            {course.coverImage ? (
              <img
                src={course.coverImage}
                alt={course.title}
                width={1280}
                height={714}
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                <BookOpen className="w-10 h-10" />
              </div>
            )}
          </div>

          <div className="p-6 space-y-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-medium text-[var(--dba-text-secondary)]">
                Acceso al programa
              </span>
              <span className="text-2xl font-bold font-mono tabular-nums text-[var(--dba-text-primary)]">
                {formatPrice(course.priceCents, course.currency)}
              </span>
            </div>

            {isEnrolled && enrollment && (
              <CourseProgressBar
                percent={enrollment.progressPercent}
                label="Tu avance actual"
                size="md"
              />
            )}

            <button
              type="button"
              disabled={enrolling}
              onClick={() => void handlePrimaryAction()}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors min-h-[44px] ${
                prereqCourses.length > 0 && !prereqsMet && !isAdmin
                  ? 'border border-amber-300 dark:border-amber-700 bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] disabled:opacity-60 text-[var(--dba-accent-foreground)]'
              }`}
            >
              {prereqCourses.length > 0 && !prereqsMet && !isAdmin ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>
                    Completar {prereqCourses[0]?.title.split(':')[0] || 'prerrequisito'} primero
                  </span>
                </>
              ) : isEnrolled || hasInstructorAccess ? (
                <>
                  <Play className="w-4 h-4" />
                  <span>{isEnrolled ? t('continueCourse') : 'Abrir curso'}</span>
                </>
              ) : (
                <>
                  <span>
                    {enrolling
                      ? 'Procesando...'
                      : course.priceCents === 0
                        ? 'Inscribirse gratis'
                        : t('enrollNow')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {!isEnrolled && !hasInstructorAccess && course.priceCents > 0 && prereqsMet && (
              <button
                type="button"
                onClick={() => setShowRedeemModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--dba-border-strong)] bg-[var(--dba-bg-canvas)] hover:bg-stone-100 dark:hover:bg-zinc-800 px-5 py-2.5 text-xs font-semibold text-[var(--dba-text-primary)] transition-colors min-h-[40px]"
              >
                <Gift className="w-4 h-4 text-[var(--dba-accent-ink)]" />
                <span>¿Tienes una Gift Card? Canjear código</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCourseId(course.id);
                  setActiveView('instructor');
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 px-5 py-2.5 text-xs font-semibold text-amber-800 dark:text-amber-200 transition-colors min-h-[40px]"
              >
                <Pencil className="w-4 h-4" />
                <span>Editar curso completo (Administrador)</span>
              </button>
            )}

            <ul className="pt-4 border-t border-[var(--dba-border)] space-y-3 text-xs text-[var(--dba-text-secondary)]">
              {prereqCourses.length > 0 && (
                <li className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-[var(--dba-accent-ink)] shrink-0" />
                  <span>
                    Prerrequisito:{' '}
                    <strong className="font-semibold text-[var(--dba-text-primary)]">
                      {prereqCourses.map((p) => p.title.split(':')[0]).join(', ')}
                    </strong>
                  </span>
                </li>
              )}
              <li className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[var(--dba-accent-ink)] shrink-0" />
                <span className="tabular-nums">
                  {course.modules.length} módulos · {course.totalLessons} lecciones
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[var(--dba-accent-ink)] shrink-0" />
                <span className="tabular-nums">{totalHours} horas de estudio estimadas</span>
              </li>
              {isExcelCourse && (
                <li className="flex items-center gap-2.5">
                  <Box className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Laboratorio práctico y Simulador 3D interactivo</span>
                </li>
              )}
              <li className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-[var(--dba-accent-ink)] shrink-0" />
                <span>Certificado PDF verificable al completar</span>
              </li>
              <li className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[var(--dba-accent-ink)] shrink-0" />
                <span>Sincronización multi-dispositivo en tiempo real</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {checkoutCourse && (
        <CheckoutModal
          course={checkoutCourse}
          initialGiftCardCode={checkoutGiftCardCode}
          onClose={() => {
            setCheckoutCourse(null);
            setCheckoutGiftCardCode('');
          }}
          onSuccess={(courseId) => {
            setCheckoutCourse(null);
            setCheckoutGiftCardCode('');
            setSelectedCourseId(courseId);
            setActiveView('learning');
          }}
        />
      )}

      {showRedeemModal && (
        <RedeemGiftCardModal
          initialCourse={course}
          onClose={() => setShowRedeemModal(false)}
          onEnrolled={(courseId) => {
            setShowRedeemModal(false);
            setSelectedCourseId(courseId);
            setActiveView('learning');
          }}
          onContinuePartialCheckout={(targetCourse, code) => {
            setShowRedeemModal(false);
            setCheckoutGiftCardCode(code);
            setCheckoutCourse(targetCourse);
          }}
        />
      )}
    </div>
  );
};
