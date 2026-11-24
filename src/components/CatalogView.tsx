import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, Gift, Lock, Pencil, Play, Search, X } from 'lucide-react';
import { motion } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import type { Course } from '../types';
import { formatCurrency } from '../utils/currency';
import { CheckoutModal } from './CheckoutModal';
import { RedeemGiftCardModal } from './RedeemGiftCardModal';
import { CourseProgressBar } from './ui/CourseProgressBar';

const KNOWN_TECHNOLOGIES: readonly string[] = [
  'Excel',
  'Power Query',
  'DAX',
  'Power Pivot',
  'Macros VBA',
  'BUSCARX',
  'XLOOKUP',
  'Tablas Dinámicas',
  'Simulador 3D',
  'Lenguaje M',
  'Dashboards',
  'Python',
  'SQL',
  'Power BI',
  'TypeScript',
  'React',
  'Firebase',
];

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getCourseTechnologies(course: Course): string[] {
  if (course.technologies && course.technologies.length > 0) {
    return course.technologies;
  }
  const corpus = normalizeSearchText(
    [
      course.title,
      course.subtitle,
      course.description,
      course.category,
      ...course.modules.flatMap((m) => [
        m.title,
        ...m.lessons.map((l) => `${l.title} ${l.summary}`),
      ]),
    ].join(' ')
  );

  const detected = KNOWN_TECHNOLOGIES.filter((tech) =>
    corpus.includes(normalizeSearchText(tech))
  );
  return detected.length > 0 ? detected : [course.category];
}

export const CatalogView: React.FC = () => {
  const {
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
  const [selectedTech, setSelectedTech] = useState('all');
  const [selectedInstructor, setSelectedInstructor] = useState('all');
  const [checkoutCourse, setCheckoutCourse] = useState<Course | null>(null);
  const [checkoutGiftCardCode, setCheckoutGiftCardCode] = useState('');
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  const visibleCourses = useMemo(
    () => courses.filter((c) => c.published || isAdmin),
    [courses, isAdmin]
  );

  const categories = useMemo(() => {
    const set = new Set(visibleCourses.map((c) => c.category));
    return ['all', ...Array.from(set)];
  }, [visibleCourses]);

  const instructors = useMemo(() => {
    const set = new Set(
      visibleCourses.map((c) => c.instructorName?.trim()).filter((n): n is string => Boolean(n))
    );
    return Array.from(set);
  }, [visibleCourses]);

  const availableTechnologies = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    visibleCourses.forEach((course) => {
      getCourseTechnologies(course).forEach((tech) => {
        if (!seen.has(tech)) {
          seen.add(tech);
          ordered.push(tech);
        }
      });
    });
    return ordered.slice(0, 8);
  }, [visibleCourses]);

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeSearchText(search.trim());
    const tokens = normalizedQuery ? normalizedQuery.split(/\s+/).filter(Boolean) : [];

    return visibleCourses.filter((c) => {
      const courseTechs = getCourseTechnologies(c);

      if (tokens.length > 0) {
        const haystack = normalizeSearchText(
          [
            c.title,
            c.subtitle,
            c.description,
            c.category,
            c.instructorName,
            ...courseTechs,
            ...c.modules.flatMap((m) => [
              m.title,
              ...m.lessons.map((l) => `${l.title} ${l.summary}`),
            ]),
          ].join(' ')
        );
        if (!tokens.every((token) => haystack.includes(token))) {
          return false;
        }
      }

      const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
      const matchesLevel = selectedLevel === 'all' || c.level === selectedLevel;
      const matchesTech =
        selectedTech === 'all' ||
        courseTechs.some((tech) => normalizeSearchText(tech) === normalizeSearchText(selectedTech));
      const matchesInstructor =
        selectedInstructor === 'all' || c.instructorName === selectedInstructor;

      return matchesCategory && matchesLevel && matchesTech && matchesInstructor;
    });
  }, [visibleCourses, search, selectedCategory, selectedLevel, selectedTech, selectedInstructor]);

  const hasActiveFilters = Boolean(
    search.trim() ||
      selectedCategory !== 'all' ||
      selectedLevel !== 'all' ||
      selectedTech !== 'all' ||
      selectedInstructor !== 'all'
  );

  const resetAllFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSelectedTech('all');
    setSelectedInstructor('all');
  };

  const levelLabel = (lvl: Course['level']) => {
    if (lvl === 'beginner') return t('beginner');
    if (lvl === 'intermediate') return t('intermediate');
    return t('advanced');
  };

  const formatPrice = (cents: number, currency: Course['currency']) => {
    if (cents === 0) return 'Gratis';
    return formatCurrency(cents, currency);
  };

  return (
    <div className="space-y-5">
      {/* Dark Brand Catalog Header */}
      <section className="rounded-xl border border-zinc-800/90 bg-[var(--dba-bg-hero)] text-zinc-100 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-8 p-5 sm:p-6 lg:p-7 flex flex-col justify-center">
            <p className="text-xs font-semibold tracking-wide text-amber-300">
              {t('brand')} · Catálogo técnico
            </p>
            <h1 className="mt-1.5 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight text-balance">
              {t('heroTitle')}
            </h1>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed max-w-2xl">
              {t('heroSubtitle')}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href="#catalog-grid"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-4 py-2 text-xs font-semibold text-[var(--dba-accent-foreground)] transition-colors whitespace-nowrap min-h-[40px]"
              >
                <span>{t('exploreCatalog')}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setShowRedeemModal(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-400/50 bg-zinc-900/80 hover:bg-zinc-800 px-4 py-2 text-xs font-semibold text-amber-300 transition-colors whitespace-nowrap min-h-[40px]"
              >
                <Gift className="w-4 h-4" />
                <span>Canjear Gift Card</span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceRole('instructor');
                    setActiveView('instructor');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/70 hover:bg-zinc-800 px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap min-h-[40px]"
                >
                  <span>{t('openInstructor')}</span>
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 relative min-h-[170px] lg:min-h-full bg-[var(--dba-bg-hero-surface)]">
            <img
              src="/assets/images/track_data_analytics_1795271913869.webp"
              alt="Laboratorio de Excel y Analítica de DB Academy"
              width={1200}
              height={896}
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--dba-bg-hero)]/90 via-[var(--dba-bg-hero)]/25 to-transparent" />
            <div className="absolute bottom-3.5 left-4 right-4 text-white">
              <p className="text-[11px] font-mono text-amber-300">Programa destacado</p>
              <p className="text-xs sm:text-sm font-semibold text-white mt-0.5">
                Cursos Excel · Simulador 3D Interactivo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Toolbar */}
      <section id="catalog-grid" className="space-y-3.5">
        <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div role="search" className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && search) {
                    setSearch('');
                  }
                }}
                aria-label={t('searchCourses')}
                placeholder={t('searchCourses')}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] pl-10 pr-11 py-2.5 text-base sm:text-sm text-[var(--dba-text-primary)] placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--dba-accent-ink)] min-h-[44px]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Limpiar búsqueda"
                  title="Limpiar búsqueda"
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md text-zinc-500 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-stone-200/60 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1 p-1 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] overflow-x-auto max-w-full">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
                      selectedCategory === cat
                        ? 'bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)]'
                        : 'text-[var(--dba-text-secondary)] hover:bg-stone-200/60 dark:hover:bg-zinc-800'
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
                className="rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs font-medium text-[var(--dba-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--dba-accent-ink)] min-h-[40px]"
              >
                <option value="all">{t('allLevels')}</option>
                <option value="beginner">{t('beginner')}</option>
                <option value="intermediate">{t('intermediate')}</option>
                <option value="advanced">{t('advanced')}</option>
              </select>

              {instructors.length > 1 && (
                <select
                  value={selectedInstructor}
                  onChange={(e) => setSelectedInstructor(e.target.value)}
                  aria-label="Filtrar por instructor"
                  className="rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs font-medium text-[var(--dba-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--dba-accent-ink)] min-h-[40px]"
                >
                  <option value="all">Todos los instructores</option>
                  {instructors.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
                Tecnologías:
              </span>
              <button
                type="button"
                onClick={() => setSelectedTech('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedTech === 'all'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Todas
              </button>
              {availableTechnologies.map((tech) => {
                const active = selectedTech === tech;
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => setSelectedTech(active ? 'all' : tech)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)] font-semibold'
                        : 'text-[var(--dba-text-secondary)] hover:bg-stone-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {tech}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 text-xs text-[var(--dba-text-secondary)]">
              <span className="font-mono tabular-nums">
                {filtered.length} de {visibleCourses.length} cursos
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="font-semibold text-[var(--dba-accent-ink)] hover:underline whitespace-nowrap"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
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
              onClick={resetAllFilters}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 grid-cols-[repeat(auto-fill,minmax(270px,1fr))]">
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
                  className="group rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] overflow-hidden flex flex-col transition-colors hover:border-[var(--dba-border-strong)]"
                >
                  <div className="aspect-video w-full bg-zinc-900 relative overflow-hidden">
                    {course.coverImage ? (
                      <img
                        src={course.coverImage}
                        alt={course.title}
                        width={1280}
                        height={714}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-400">
                        <BookOpen className="w-10 h-10" />
                      </div>
                    )}
                  </div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col">
                    {/* Unboxed Typographic Metadata (Zero-Pill Rule) */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--dba-text-secondary)]">
                      <span className="font-semibold text-[var(--dba-accent-ink)]">
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
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                      {getCourseTechnologies(course).slice(0, 4).join(' · ')}
                    </p>

                    {hasPrereqs && (
                      <div className="mt-3">
                        {prereqsCompleted || isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {isAdmin
                                ? 'Acceso Administrador (Sin restricciones)'
                                : `Prerrequisito completado: ${prereqCourses.map((p) => p.title.split(':')[0]).join(', ')}`}
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
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCourseId(course.id);
                              setActiveView('instructor');
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors whitespace-nowrap min-h-[40px]"
                            title="Editar curso completo como administrador"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                        )}
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

                        {hasPrereqs && !prereqsCompleted && !isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (prereqCourses[0]) {
                                setSelectedCourseId(prereqCourses[0].id);
                                setActiveView('course-detail');
                              }
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 px-3.5 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>
                              Completar {prereqCourses[0]?.title.split(':')[0] || 'prerrequisito'}
                            </span>
                          </button>
                        ) : isEnrolled || isAdmin ? (
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
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-4 py-2 text-xs font-semibold text-[var(--dba-accent-foreground)] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
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
          onClose={() => setShowRedeemModal(false)}
          onEnrolled={(courseId) => {
            setShowRedeemModal(false);
            setSelectedCourseId(courseId);
            setActiveView('learning');
          }}
          onContinuePartialCheckout={(course, code) => {
            setShowRedeemModal(false);
            setCheckoutGiftCardCode(code);
            setCheckoutCourse(course);
          }}
        />
      )}
    </div>
  );
};
