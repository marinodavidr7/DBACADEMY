import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  ChevronDown,
  Code2,
  Cpu,
  Database,
  Layers,
  LockKeyhole,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { FIREBASE_AUTH_SETTINGS_URL } from '../firebase';
import type { Course } from '../types';
import { formatCurrency } from '../utils/currency';
import { BrandLogo } from './ui/BrandLogo';
import { Container } from './ui/Container';
import { PWAInstallButton } from './PWAInstallButton';

interface LandingPageProps {
  onExplore: () => void;
  onSelectCourse: (courseId: string) => void;
  onOpenLearning: () => void;
  onSignIn: () => void | Promise<void>;
}

interface AcademicTrackPreview {
  id: string;
  area: string;
  title: string;
  subtitle: string;
  coverImage: string;
  meta: string;
}

const ACADEMIC_PILLARS: readonly AcademicTrackPreview[] = [
  {
    id: 'pillar-architecture',
    area: 'Ingeniería & Cloud',
    title: 'Arquitectura de Sistemas y APIs Escalables',
    subtitle: 'Diseño distribuido, microservicios, bases de datos y despliegues resilientes en producción.',
    coverImage: '/assets/images/course_system_architecture_1795146988857.webp',
    meta: 'Próxima apertura',
  },
  {
    id: 'pillar-data',
    area: 'Ciencia de Datos',
    title: 'Analítica Aplicada, Python y Modelado de KPIs',
    subtitle: 'Limpieza de datos, análisis exploratorio, automatización de reportes y tableros ejecutivos.',
    coverImage: '/assets/images/course_data_science_1795146987818.webp',
    meta: 'Próxima apertura',
  },
  {
    id: 'pillar-security',
    area: 'Ciberseguridad',
    title: 'Seguridad Zero-Trust y Criptografía Aplicada',
    subtitle: 'Control de accesos, cifrado de extremo a extremo, auditoría y protección de aplicaciones web.',
    coverImage: '/assets/images/course_cybersecurity_e2ee_1795146988090.webp',
    meta: 'Próxima apertura',
  },
  {
    id: 'pillar-ux',
    area: 'Diseño de Producto',
    title: 'Ingeniería UX/UI y Sistemas de Diseño',
    subtitle: 'Accesibilidad WCAG, prototipado funcional, arquitectura de información y componentes escalables.',
    coverImage: '/assets/images/course_ux_engineering_1795146988343.webp',
    meta: 'Próxima apertura',
  },
];

const formatPrice = (cents: number, currency: Course['currency']) => {
  if (cents === 0) return 'Gratis';
  return formatCurrency(cents, currency);
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onExplore,
  onSelectCourse,
  onOpenLearning,
  onSignIn,
}) => {
  const { user, courses, theme, toggleTheme, authError, clearAuthError, t } = usePlatform();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const publishedCourses = courses.filter((c) => c.published);
  const featuredCourse = publishedCourses[0] || null;
  const secondaryTracks = publishedCourses.slice(1, 4);
  const fallbackPillars = ACADEMIC_PILLARS.slice(0, Math.max(0, 3 - secondaryTracks.length));

  const levelLabel = (level: Course['level']) => {
    if (level === 'beginner') return t('beginner');
    if (level === 'intermediate') return t('intermediate');
    return t('advanced');
  };

  const navLinks = [
    { href: '#rutas', label: 'Disciplinas' },
    { href: '#cursos', label: 'Catálogo' },
    { href: '#metodologia', label: 'Metodología' },
    { href: '#preguntas', label: 'Preguntas' },
  ];

  return (
    <div id="top" className="min-h-[100dvh] overflow-x-hidden bg-[var(--dba-bg-canvas)] text-[var(--dba-text-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/90 bg-[var(--dba-bg-hero)]/95 backdrop-blur text-zinc-100 safe-pt">
        <Container>
          <div className="flex h-16 items-center justify-between gap-8">
            <a href="#top" className="flex items-center whitespace-nowrap shrink-0">
              <BrandLogo size="md" surface="dark" wordmarkClassName="text-white" />
            </a>

            <nav
              aria-label="Navegación principal"
              className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300"
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="hidden sm:block">
                <PWAInstallButton label={t('installApp')} />
              </div>
              <button
                type="button"
                onClick={user ? onOpenLearning : onExplore}
                className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-4 py-2 text-xs font-semibold text-[var(--dba-accent-foreground)] transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
              >
                <span>{user ? 'Mi Aprendizaje' : 'Explorar catálogo'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setMobileNavOpen((o) => !o)}
                aria-label={mobileNavOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={mobileNavOpen}
                className="md:hidden p-2 rounded-lg text-slate-200 hover:bg-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </Container>

        {mobileNavOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-[var(--dba-bg-hero)] px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileNavOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-1 flex flex-col gap-2">
              <PWAInstallButton label={t('installApp')} />
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  if (user) onOpenLearning();
                  else onExplore();
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-4 py-2.5 text-sm font-semibold text-[var(--dba-accent-foreground)] min-h-[44px]"
              >
                <span>{user ? 'Ir a Mi Aprendizaje' : 'Explorar catálogo'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {authError && (
        <div className="bg-red-950 border-b border-red-800 text-red-100 px-4 py-3 text-xs">
          <Container>
            <div className="mx-auto flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p>{authError}</p>
                {authError.includes('Authorized domains') && (
                  <a
                    href={FIREBASE_AUTH_SETTINGS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block font-semibold underline text-white"
                  >
                    Abrir Firebase Console → Authentication → Settings
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={clearAuthError}
                className="text-xs font-semibold underline shrink-0"
              >
                Cerrar
              </button>
            </div>
          </Container>
        </div>
      )}

      <main>
        {/* Hero */}
        <section className="bg-[var(--dba-bg-hero)] text-zinc-100 border-b border-zinc-800/90 py-10 sm:py-12 lg:py-14 flex items-center min-h-[min(calc(100dvh-4rem),660px)]">
          <Container prose={false}>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-8 lg:gap-12 items-center">
              <div className="flex flex-col justify-center">
                <p className="text-xs font-semibold tracking-wide text-amber-300">
                  Academia técnica multidisciplinaria · DB Academy
                </p>
                <h1 className="mt-2.5 font-display text-4xl sm:text-5xl lg:text-[3.25rem] 2xl:text-6xl font-bold tracking-tight text-white leading-[1.08] text-balance">
                  Domina tecnología, datos y herramientas profesionales paso a paso.
                </h1>
                <p className="mt-4 max-w-prose text-base leading-relaxed text-zinc-300">
                  Programas prácticos en Ingeniería de Software, Analítica y Excel, Ciberseguridad y Diseño UX/UI. Aprende con laboratorios interactivos, seguimiento en vivo y certificados verificables.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onExplore}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-6 py-3 text-sm font-semibold text-[var(--dba-accent-foreground)] transition-colors whitespace-nowrap min-h-[46px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dba-accent)] active:scale-95"
                  >
                    <span>Explorar cursos</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => (user ? onOpenLearning() : void onSignIn())}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors whitespace-nowrap min-h-[46px] focus-visible:outline-none focus-visible:ring-2 active:scale-95 ${
                      user
                        ? 'bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] text-[var(--dba-accent-foreground)] focus-visible:ring-[var(--dba-accent)]'
                        : 'border border-zinc-700 bg-zinc-900/70 hover:bg-zinc-800 text-white focus-visible:ring-zinc-600'
                    }`}
                  >
                    <span>{user ? 'Ir a Mi Panel' : 'Iniciar sesión'}</span>
                  </button>
                </div>

                <div className="mt-6 pt-5 border-t border-zinc-800 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-300">
                  <span className="inline-flex items-center gap-1.5 text-zinc-200">
                    <Check className="w-3.5 h-3.5 text-amber-300" />
                    <span>Catálogo multi-área</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-zinc-200">
                    <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                    <span>Laboratorios y simuladores</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-zinc-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                    <span>Certificación verificable QR</span>
                  </span>
                </div>
              </div>

              <div className="relative h-full min-h-[340px] lg:min-h-[410px] rounded-xl overflow-hidden border border-zinc-800 bg-[var(--dba-bg-hero-surface)]">
                <AcademyCampusPreview />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--dba-bg-hero)] via-[var(--dba-bg-hero)]/90 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-amber-300 uppercase tracking-wider tabular-nums">
                      {featuredCourse
                        ? `Programa disponible · ${formatPrice(featuredCourse.priceCents, featuredCourse.currency)}`
                        : 'Campus técnico multi-disciplinario'}
                    </p>
                    <p className="mt-0.5 font-display text-base sm:text-lg font-bold text-white truncate">
                      {featuredCourse?.title || 'Formación práctica por módulos y evaluación'}
                    </p>
                  </div>
                  {featuredCourse && (
                    <button
                      type="button"
                      onClick={() => onSelectCourse(featuredCourse.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/85 hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600 active:scale-95"
                    >
                      <span>Ver programa</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Stats Strip */}
        <section className="border-b border-[var(--dba-border)] bg-[var(--dba-bg-surface)]">
          <Container>
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[var(--dba-border)]">
              <div className="p-5 sm:p-6 flex flex-col h-full">
                <p className="font-display text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[var(--dba-text-primary)]">
                  4+ Áreas
                </p>
                <p className="mt-1 text-xs sm:text-sm text-[var(--dba-text-secondary)] leading-snug">
                  Ingeniería, Datos, Diseño y Productividad
                </p>
              </div>
              <div className="p-5 sm:p-6 flex flex-col h-full">
                <p className="font-display text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[var(--dba-accent-ink)]">
                  {publishedCourses.length}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-[var(--dba-text-secondary)] leading-snug">
                  {publishedCourses.length === 1 ? 'Programa activo en catálogo' : 'Programas activos en catálogo'}
                </p>
              </div>
              <div className="p-5 sm:p-6 flex flex-col h-full">
                <p className="font-display text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[var(--dba-text-primary)]">
                  SHA-256
                </p>
                <p className="mt-1 text-xs sm:text-sm text-[var(--dba-text-secondary)] leading-snug">
                  Certificados verificables con QR
                </p>
              </div>
              <div className="p-5 sm:p-6 flex flex-col h-full">
                <p className="font-display text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[var(--dba-text-primary)]">
                  RD$ / USD
                </p>
                <p className="mt-1 text-xs sm:text-sm text-[var(--dba-text-secondary)] leading-snug">
                  Inscripción directa y Gift Cards
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* Disciplinas y Rutas de Aprendizaje */}
        <section id="rutas" className="scroll-mt-20 py-10 sm:py-14">
          <Container>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="max-w-prose">
                <p className="text-xs font-semibold text-[var(--dba-accent-ink)]">
                  01. Disciplinas y rutas académicas
                </p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--dba-text-primary)] text-balance">
                  Trayectorias técnicas en múltiples áreas de especialización
                </h2>
              </div>
              <button
                type="button"
                onClick={onExplore}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--dba-accent-ink)] hover:underline whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:underline active:scale-95"
              >
                <span>Ver todo el catálogo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Programa Destacado Publicado */}
              {featuredCourse && (
                <article className="lg:col-span-7 rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] overflow-hidden flex flex-col">
                  <div className="aspect-[16/9] w-full bg-zinc-900 relative overflow-hidden">
                    <img
                      src={featuredCourse.coverImage || '/assets/images/course_system_architecture_1795146988857.webp'}
                      alt={featuredCourse.title}
                      width={1280}
                      height={714}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 sm:p-7 flex-1 flex flex-col">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--dba-text-secondary)]">
                      <span className="font-semibold text-[var(--dba-accent-ink)]">
                        Inscripción abierta · {featuredCourse.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{levelLabel(featuredCourse.level)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{featuredCourse.modules.length} módulos</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{featuredCourse.totalLessons} lecciones</span>
                    </div>
                    <h3 className="mt-2.5 font-display text-xl font-bold text-[var(--dba-text-primary)]">
                      {featuredCourse.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--dba-text-secondary)]">
                      {featuredCourse.description}
                    </p>
                    <div className="mt-auto pt-6 flex flex-wrap items-center justify-between gap-4">
                      <span className="font-mono text-base font-bold tabular-nums text-[var(--dba-text-primary)]">
                        {formatPrice(featuredCourse.priceCents, featuredCourse.currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectCourse(featuredCourse.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-4 py-2.5 text-xs font-semibold text-[var(--dba-accent-foreground)] transition-colors min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dba-accent-ink)] active:scale-95"
                      >
                        <span>Explorar programa y temario</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              )}

              {/* Rutas Secundarias + Pilares Multidisciplinarios */}
              <div className={`${featuredCourse ? 'lg:col-span-5' : 'lg:col-span-12 grid grid-cols-1 md:grid-cols-3'} flex flex-col gap-4`}>
                {secondaryTracks.map((track) => (
                  <article
                    key={track.id}
                    className="flex-1 rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-5 flex flex-col justify-between hover:border-[var(--dba-border-strong)] transition-colors"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--dba-text-secondary)]">
                        <span className="font-semibold text-[var(--dba-accent-ink)]">
                          {track.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{levelLabel(track.level)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{track.modules.length} módulos</span>
                      </div>
                      <h3 className="mt-2 font-display text-base font-bold text-[var(--dba-text-primary)]">
                        {track.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[var(--dba-text-secondary)] line-clamp-2">
                        {track.subtitle}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--dba-border)] flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-bold tabular-nums text-[var(--dba-text-primary)]">
                        {formatPrice(track.priceCents, track.currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectCourse(track.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--dba-accent-ink)] hover:underline min-h-[36px] focus-visible:outline-none focus-visible:underline active:scale-95"
                      >
                        <span>Ver programa</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </article>
                ))}

                {fallbackPillars.map((pillar) => (
                  <article
                    key={pillar.id}
                    className="flex-1 rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-4 flex items-center gap-4"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-900 shrink-0">
                      <img
                        src={pillar.coverImage}
                        alt={pillar.title}
                        width={320}
                        height={180}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--dba-text-secondary)]">
                        <span className="font-semibold text-[var(--dba-accent-ink)]">{pillar.area}</span>
                        <span aria-hidden="true">·</span>
                        <span>{pillar.meta}</span>
                      </div>
                      <h3 className="mt-1 font-display text-sm font-bold text-[var(--dba-text-primary)] leading-snug">
                        {pillar.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--dba-text-secondary)] line-clamp-2">
                        {pillar.subtitle}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Catálogo de Cursos y Áreas Académicas */}
        <section
          id="cursos"
          className="scroll-mt-20 border-y border-[var(--dba-border)] bg-[var(--dba-bg-surface)] py-10 sm:py-14"
        >
          <Container>
            <div className="max-w-prose">
              <p className="text-xs font-semibold text-[var(--dba-accent-ink)]">
                02. Catálogo de cursos
              </p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--dba-text-primary)] text-balance">
                Programas estructurados por módulos y evaluación práctica
              </h2>
            </div>

            <div className="mt-10 grid gap-6 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
              {publishedCourses.map((course) => (
                <article
                  key={course.id}
                  className="group rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] overflow-hidden flex flex-col transition-colors hover:border-[var(--dba-border-strong)]"
                >
                  <div className="aspect-video w-full bg-zinc-900 overflow-hidden">
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
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <BookOpen className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--dba-text-secondary)]">
                      <span className="font-semibold text-[var(--dba-accent-ink)]">
                        {course.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{levelLabel(course.level)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{course.totalLessons} lecciones</span>
                    </div>
                    <h3 className="mt-2 font-display text-base font-bold text-[var(--dba-text-primary)] leading-snug">
                      {course.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--dba-text-secondary)] line-clamp-2">
                      {course.subtitle}
                    </p>
                    <div className="mt-auto pt-5 flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-bold tabular-nums text-[var(--dba-text-primary)]">
                        {formatPrice(course.priceCents, course.currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectCourse(course.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-3.5 py-2 text-xs font-semibold text-[var(--dba-accent-foreground)] transition-colors min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dba-accent-ink)] active:scale-95"
                      >
                        <span>Ver programa</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Áreas de formación de DB Academy */}
            <div className="mt-10 pt-8 border-t border-[var(--dba-border)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <p className="text-xs font-semibold text-[var(--dba-accent-ink)]">
                    Ecosistema académico DB Academy
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--dba-text-secondary)]">
                    Líneas de formación diseñadas para cubrir habilidades clave de la industria digital y empresarial.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    icon: Cpu,
                    area: 'Ingeniería & Cloud',
                    desc: 'Arquitectura de software, TypeScript, React, APIs REST y Firebase.',
                  },
                  {
                    icon: Database,
                    area: 'Datos & Productividad',
                    desc: 'Excel aplicado, modelado de datos, Python, SQL e inteligencia de negocios.',
                  },
                  {
                    icon: ShieldCheck,
                    area: 'Ciberseguridad',
                    desc: 'Seguridad Zero-Trust, cifrado AES-GCM, autenticación y protección web.',
                  },
                  {
                    icon: Code2,
                    area: 'Diseño de Producto',
                    desc: 'Sistemas de diseño, accesibilidad técnica y experiencia de usuario.',
                  },
                ].map((area) => {
                  const Icon = area.icon;
                  return (
                    <div
                      key={area.area}
                      className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-4 flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[var(--dba-accent-ink)] shrink-0" />
                        <h3 className="font-display text-sm font-bold text-[var(--dba-text-primary)]">
                          {area.area}
                        </h3>
                      </div>
                      <p className="text-xs leading-relaxed text-[var(--dba-text-secondary)]">
                        {area.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Container>
        </section>

        {/* Metodología y Capacidades Reales */}
        <section id="metodologia" className="scroll-mt-20 py-10 sm:py-14">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 max-w-prose">
                <p className="text-xs font-semibold text-[var(--dba-accent-ink)]">
                  03. Metodología DB Academy
                </p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--dba-text-primary)] text-balance">
                  De la teoría al laboratorio en una sola plataforma
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-[var(--dba-text-secondary)]">
                  Cada programa combina lecciones guiadas, validación práctica inmediata, seguimiento de avance en tiempo real y emisión automática de certificados al completar el 100% del currículo.
                </p>

                <div className="mt-5 rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-4 space-y-1.5">
                  <p className="text-xs font-semibold text-[var(--dba-text-primary)]">
                    Progresión guiada por capítulos y módulos
                  </p>
                  <p className="text-xs text-[var(--dba-text-secondary)] leading-relaxed">
                    Cada capítulo y módulo se desbloquea de forma secuencial al completar sus prácticas y evaluaciones, asegurando dominio real antes de avanzar.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: Cpu,
                    title: 'Laboratorios prácticos e interactivos',
                    body: 'Aplica lo aprendido en entornos guiados, simuladores 3D, hojas de cálculo y evaluaciones por módulo con retroalimentación inmediata.',
                  },
                  {
                    icon: Layers,
                    title: 'Progreso sincronizado en vivo',
                    body: 'Tu avance por módulo, calendario de entregas y notas se mantienen sincronizados entre tus dispositivos.',
                  },
                  {
                    icon: Award,
                    title: 'Certificados con firma SHA-256',
                    body: 'Al completar un programa obtienes un certificado PDF oficial firmado y con código QR público verificable.',
                  },
                  {
                    icon: LockKeyhole,
                    title: 'Bóveda personal cifrada E2EE',
                    body: 'Tus apuntes privados se cifran en el navegador con AES-GCM-256 antes de guardarse en la nube.',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <article
                      key={item.title}
                      className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-6"
                    >
                      <Icon className="w-5 h-5 text-[var(--dba-accent-ink)]" />
                      <h3 className="mt-4 font-display text-base font-bold text-[var(--dba-text-primary)]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--dba-text-secondary)]">
                        {item.body}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </Container>
        </section>

        {/* Preguntas Frecuentes */}
        <section
          id="preguntas"
          className="scroll-mt-20 border-t border-[var(--dba-border)] bg-[var(--dba-bg-surface)] py-10 sm:py-14"
        >
          <Container prose={true}>
            <p className="text-xs font-semibold text-[var(--dba-accent-ink)]">
              04. Preguntas frecuentes
            </p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--dba-text-primary)]">
              Información antes de comenzar
            </h2>
            <div className="mt-6 divide-y divide-[var(--dba-border)] rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-5">
              {[
                {
                  q: '¿Qué disciplinas y cursos ofrece DB Academy?',
                  a: 'DB Academy integra formación en Productividad y Excel avanzado, Ciencia de Datos, Ingeniería de Software, Diseño de Producto UX/UI y Ciberseguridad, con nuevos programas incorporándose continuamente al catálogo.',
                },
                {
                  q: '¿Cómo puedo inscribirme o canjear una Gift Card?',
                  a: 'Puedes inscribirte directamente desde el catálogo pagando en pesos dominicanos (RD$) o USD, o activar un programa al instante canjeando el código de tu Gift Card desde el catálogo.',
                },
                {
                  q: '¿Necesito cuenta para explorar los cursos y temarios?',
                  a: 'No. Puedes revisar todo el catálogo, las rutas de aprendizaje y el temario completo de cada programa antes de iniciar sesión o inscribirte.',
                },
                {
                  q: '¿Cómo se verifican los certificados emitidos?',
                  a: 'Cada certificado emitido al completar el 100% incluye un código único verificable, código QR escaneable, firma digital SHA-256 y descarga en PDF.',
                },
              ].map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="flex min-h-[28px] cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[var(--dba-text-primary)] [&::-webkit-details-marker]:hidden">
                    <span>{item.q}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[var(--dba-text-secondary)]">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </Container>
        </section>

        {/* Cierre Oscuro CTA */}
        <section className="bg-[var(--dba-bg-hero)] text-zinc-100 py-10 sm:py-12 border-t border-zinc-800">
          <Container>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-prose">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white text-balance">
                  Impulsa tu carrera técnica hoy en DB Academy
                </h2>
                <p className="mt-2 text-sm text-zinc-300">
                  Accede con tu cuenta de Google, explora el catálogo multidisciplinario o canjea una Gift Card desde cualquier dispositivo.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={user ? onOpenLearning : onExplore}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-5 py-3 text-sm font-semibold text-[var(--dba-accent-foreground)] transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dba-accent)] active:scale-95"
                >
                  <span>{user ? 'Ir a Mi Aprendizaje' : 'Ver catálogo'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                {!user && (
                  <button
                    type="button"
                    onClick={() => void onSignIn()}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 px-5 py-3 text-sm font-semibold text-white transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600 active:scale-95"
                  >
                    <span>Iniciar sesión</span>
                  </button>
                )}
              </div>
            </div>
          </Container>
        </section>
      </main>

      <footer className="border-t border-zinc-800 bg-[#050507] text-zinc-400">
        <Container>
          <div className="py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrandLogo size="sm" surface="dark" wordmarkClassName="text-white" />
              <span className="text-xs text-slate-400">· Formación técnica multidisciplinaria</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="hover:text-white transition-colors">
                  {link.label}
                </a>
              ))}
              <button
                type="button"
                onClick={() => void toggleTheme()}
                title="Cambiar tema claro u oscuro"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-slate-200 hover:text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 min-h-[36px]"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span>{theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}</span>
              </button>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
};

function AcademyCampusPreview() {
  const tracks = [
    {
      area: 'Productividad & Datos',
      program: 'Excel Aplicado y Modelado de Fórmulas',
      metric: '5 módulos · Simulador 3D',
      status: 'Disponible',
    },
    {
      area: 'Ingeniería & Cloud',
      program: 'Arquitectura de Sistemas y APIs REST',
      metric: 'Laboratorios guiados',
      status: 'En preparación',
    },
    {
      area: 'Ciberseguridad E2EE',
      program: 'Seguridad Zero-Trust y Criptografía',
      metric: 'AES-GCM · Auditoría',
      status: 'En preparación',
    },
    {
      area: 'Diseño de Producto',
      program: 'Sistemas de Diseño e Ingeniería UX/UI',
      metric: 'Componentes · WCAG AA',
      status: 'En preparación',
    },
  ];

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex-1 flex flex-col bg-[#121216] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Barra superior de ventana */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-[#1A1A20]/90">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
            <span className="ml-2 text-[11px] font-mono text-zinc-300">
              Campus_DB_Academy — Multidisciplina
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-300">SHA-256 · QR</span>
        </div>

        {/* Vista previa del campus multidisciplinario */}
        <div className="flex-1 p-4 pb-24 bg-[#0A0A0D] flex flex-col justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {tracks.map((item, idx) => (
              <div
                key={item.area}
                className={`rounded-lg border p-3 ${
                  idx === 0
                    ? 'border-amber-400/40 bg-amber-500/10'
                    : 'border-zinc-800 bg-[#141419]/90'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                  <span className="text-amber-300 truncate">{item.area}</span>
                  <span className={idx === 0 ? 'text-emerald-400' : 'text-zinc-400'}>
                    {item.status}
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-semibold text-white leading-snug">
                  {item.program}
                </p>
                <p className="mt-1 text-[11px] text-zinc-400 font-mono">{item.metric}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-[#141419]/80 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-zinc-300">Evaluación continua · Bóveda E2EE</span>
            <span className="text-emerald-400">Progreso sincronizado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
