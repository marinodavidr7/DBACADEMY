import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, Lock, Play, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import type { Course } from '../types';
import { CheckoutModal } from './CheckoutModal';
import { CourseProgressBar } from './ui/CourseProgressBar';

export const CatalogView: React.FC = () => {
  const {
    user,
    isAdmin,
    courses,
    enrollments,
    certificates,
    enrollWithPayment,
    setActiveView,
    setSelectedCourseId,
    setWorkspaceRole,
    t,
  } = usePlatform();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [checkoutCourse, setCheckoutCourse] = useState<Course | null>(null);

  const categories = useMemo(() => {
    const set = new Set(courses.map((c) => c.category));
    return ['all', ...Array.from(set)];
  }, [courses]);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (!c.published && !isAdmin) {
        return false;
      }
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
      const matchesLevel = selectedLevel === 'all' || c.level === selectedLevel;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [courses, isAdmin, search, selectedCategory, selectedLevel]);

  const levelLabel = (lvl: Course['level']) => {
    if (lvl === 'beginner') return t('beginner');
    if (lvl === 'intermediate') return t('intermediate');
    return t('advanced');
  };

  const formatPrice = (cents: number, currency: Course['currency']) => {
    if (cents === 0) return 'Gratis';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(cents / 100);
  };

  return (
    <div className="space-y-8">
      {/* Dark Technological Catalog Header */}
      <section className="rounded-xl border border-slate-800/90 bg-[#070E1D] text-slate-100 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
            <p className="text-xs font-semibold tracking-wide text-cyan-300">
              {t('brand')} · Catálogo técnico
            </p>
            <h1 className="mt-2 font-display text-3xl lg:text-4xl 2xl:text-5xl font-bold tracking-tight text-white leading-tight text-balance">
              {t('heroTitle')}
            </h1>
            <p className="mt-3 text-sm sm:text-base 2xl:text-lg text-slate-300 leading-relaxed max-w-2xl">
              {t('heroSubtitle')}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#catalog-grid"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] px-5 py-2.5 text-sm font-semibold text-white transition-colors whitespace-nowrap min-h-[44px]"
              >
                <span>{t('exploreCatalog')}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceRole('instructor');
                    setActiveView('instructor');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900/60 hover:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors whitespace-nowrap min-h-[44px]"
                >
                  <span>{t('openInstructor')}</span>
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full bg-[#0D1930]">
            <img
              src="/src/assets/images/track_data_analytics_1795271913869.jpg"
              alt="Laboratorio de Excel y Analítica de DB Academy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070E1D]/90 via-[#070E1D]/25 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-xs font-mono text-cyan-300">Programa destacado</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                Excel Básico · Módulos 0 y 1 · Simulador 3D Interactivo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Toolbar */}
      <section id="catalog-grid" className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchCourses')}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052CC] min-h-[44px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] overflow-x-auto max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-[#0052CC] text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat === 'all' ? t('allCategories') : cat}
                </button>
              ))}
            </div>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              aria-label={t('allLevels')}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0052CC] min-h-[40px]"
            >
              <option value="all">{t('allLevels')}</option>
              <option value="beginner">{t('beginner')}</option>
              <option value="intermediate">{t('intermediate')}</option>
              <option value="advanced">{t('advanced')}</option>
            </select>
          </div>
        </div>

        {/* Course Cards Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-8 text-center">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              No hay cursos que coincidan con tu búsqueda o filtros actuales.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
                setSelectedLevel('all');
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            {filtered.map((course, idx) => {
              const enrollment = enrollments.find((e) => e.courseId === course.id);
              const isEnrolled = Boolean(enrollment);
              const prereqCourses = courses.filter((c) => course.prerequisites?.includes(c.id));
              const hasPrereqs = prereqCourses.length > 0;
              const prereqsCompleted =
                hasPrereqs &&
                prereqCourses.every((p) => {
                  const enr = enrollments.find((e) => e.courseId === p.id);
                  const cert = certificates.some((c) => c.courseId === p.id);
                  return (enr && enr.progressPercent >= 100) || cert || isAdmin;
                });

              return (
                <motion.article
                  key={course.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, delay: Math.min(idx * 0.05, 0.25), ease: 'easeOut' }}
                  whileHover={{ y: -2 }}
                  className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] overflow-hidden flex flex-col transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="aspect-video w-full bg-slate-900 relative overflow-hidden">
                    {course.coverImage ? (
                      <img
                        src={course.coverImage}
                        alt={course.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-400">
                        <BookOpen className="w-10 h-10" />
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    {/* Unboxed Typographic Metadata (Zero-Pill Rule) */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-[#0052CC] dark:text-cyan-400">
                        {course.category}
                      </span>
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
                      {(course.id === 'excel-basico-05' || /excel/i.test(course.title)) && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {t('navSimulator')}
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="mt-2.5 font-display text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {course.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {course.subtitle}
                    </p>

                    {hasPrereqs && (
                      <div className="mt-3">
                        {prereqsCompleted ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Prerrequisito completado:{' '}
                              {prereqCourses.map((p) => p.title.split(':')[0]).join(', ')}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded border border-amber-200/60 dark:border-amber-800/60">
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Prerrequisito:{' '}
                              {prereqCourses.map((p) => p.title.split(':')[0]).join(', ')}
                            </span>
                          </span>
                        )}
                      </div>
                    )}

                    {isEnrolled && enrollment && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <CourseProgressBar
                          percent={enrollment.progressPercent}
                          label={t('continueCourse')}
                        />
                      </div>
                    )}

                    <div className="mt-auto pt-5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {course.instructorName}
                        </p>
                        <p className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                          {formatPrice(course.priceCents, course.currency)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            setActiveView('course-detail');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap min-h-[40px]"
                        >
                          <span>Ver programa</span>
                        </button>

                        {isEnrolled || isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCourseId(course.id);
                              setActiveView('learning');
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-4 py-2 text-xs font-semibold text-white dark:text-slate-900 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 min-h-[40px]"
                          >
                            {enrollment?.progressPercent === 100 ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                            <span>{isEnrolled ? t('continueCourse') : 'Abrir curso'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              if (course.priceCents === 0) {
                                await enrollWithPayment(course, 'stripe');
                                setSelectedCourseId(course.id);
                                setActiveView('learning');
                              } else {
                                setCheckoutCourse(course);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
                          >
                            <span>
                              {course.priceCents === 0 ? 'Inscribirse gratis' : t('enrollNow')}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>

      {checkoutCourse && (
        <CheckoutModal
          course={checkoutCourse}
          onClose={() => setCheckoutCourse(null)}
          onSuccess={(courseId) => {
            setCheckoutCourse(null);
            setSelectedCourseId(courseId);
            setActiveView('learning');
          }}
        />
      )}
    </div>
  );
};
