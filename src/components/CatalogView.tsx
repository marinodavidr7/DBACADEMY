import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, Play, Search } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import type { Course } from '../types';
import { CheckoutModal } from './CheckoutModal';

export const CatalogView: React.FC = () => {
  const {
    courses,
    enrollments,
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
  }, [courses, search, selectedCategory, selectedLevel]);

  const levelLabel = (lvl: Course['level']) => {
    if (lvl === 'beginner') return t('beginner');
    if (lvl === 'intermediate') return t('intermediate');
    return t('advanced');
  };

  const formatPrice = (cents: number, currency: Course['currency']) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(cents / 100);
  };

  return (
    <div className="space-y-8">
      {/* Editorial Hero Section */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
            <p className="text-xs font-semibold tracking-wide text-blue-600 dark:text-blue-400">
              {t('brand')}
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight text-balance">
              {t('heroTitle')}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {t('heroSubtitle')}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#catalog-grid"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap min-h-[44px]"
              >
                <span>{t('exploreCatalog')}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => {
                  setWorkspaceRole('instructor');
                  setActiveView('instructor');
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap min-h-[44px]"
              >
                <span>{t('openInstructor')}</span>
              </button>
            </div>
          </div>
          <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full bg-slate-900">
            <img
              src="/src/assets/images/course_excel_basico_1795186770853.jpg"
              alt="DB Academy — Formación técnica en tiempo real"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-xs text-slate-200">
                Excel Básico · Sistemas Distribuidos · Ciencia de Datos · Seguridad E2EE
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
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-x-auto max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
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
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[40px]"
            >
              <option value="all">{t('allLevels')}</option>
              <option value="beginner">{t('beginner')}</option>
              <option value="intermediate">{t('intermediate')}</option>
              <option value="advanced">{t('advanced')}</option>
            </select>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((course) => {
            const enrollment = enrollments.find((e) => e.courseId === course.id);
            const isEnrolled = Boolean(enrollment);

            return (
              <article
                key={course.id}
                className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden flex flex-col transition-colors hover:border-slate-300 dark:hover:border-slate-700"
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
                    <span className="font-medium text-blue-600 dark:text-blue-400">{course.category}</span>
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
                  </div>

                  <h2 className="mt-2.5 text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    {course.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {course.subtitle}
                  </p>

                  {isEnrolled && enrollment && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          {enrollment.progressPercent === 100 ? t('completedBadge') : t('continueCourse')}
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                          {enrollment.progressPercent}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            enrollment.progressPercent === 100 ? 'bg-emerald-600' : 'bg-blue-600'
                          }`}
                          style={{ width: `${enrollment.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{course.instructorName}</p>
                      <p className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {formatPrice(course.priceCents, course.currency)}
                      </p>
                    </div>

                    {isEnrolled ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourseId(course.id);
                          setActiveView('learning');
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 dark:bg-slate-100 px-4 py-2 text-xs font-medium text-white dark:text-slate-900 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 min-h-[40px]"
                      >
                        {enrollment?.progressPercent === 100 ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        <span>{t('continueCourse')}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCheckoutCourse(course)}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
                      >
                        <span>{t('enrollNow')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
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
