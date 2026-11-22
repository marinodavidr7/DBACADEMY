import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Box,
  Check,
  ChevronDown,
  Layers,
  LockKeyhole,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import type { Course } from '../types';
import { BrandLogo } from './ui/BrandLogo';
import { Container } from './ui/Container';
import { PWAInstallButton } from './PWAInstallButton';

interface LandingPageProps {
  onExplore: () => void;
  onSelectCourse: (courseId: string) => void;
  onOpenLearning: () => void;
  onSignIn: () => void | Promise<void>;
}

const formatPrice = (cents: number, currency: Course['currency']) => {
  if (cents === 0) return 'Gratis';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(cents / 100);
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
  const excelCourse =
    publishedCourses.find((c) => c.id === 'excel-basico-05' || /excel/i.test(c.title)) ||
    publishedCourses[0];
  const secondaryTracks = publishedCourses.filter((c) => c.id !== excelCourse?.id).slice(0, 3);

  const levelLabel = (level: Course['level']) => {
    if (level === 'beginner') return t('beginner');
    if (level === 'intermediate') return t('intermediate');
    return t('advanced');
  };

  const navLinks = [
    { href: '#rutas', label: 'Rutas' },
    { href: '#cursos', label: 'Catálogo' },
    { href: '#metodologia', label: 'Metodología' },
    { href: '#preguntas', label: 'Preguntas' },
  ];

  return (
    <div id="top" className="min-h-[100dvh] overflow-x-hidden bg-[var(--dba-bg-canvas)] text-[var(--dba-text-primary)]">
      {/* Header — borde a borde, contenedor limitado */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070E1D]/95 backdrop-blur text-slate-100 safe-pt">
        <Container>
          <div className="flex h-16 items-center justify-between gap-8">
            {/* Zone 1: Single-line Brand Logo + Wordmark */}
            <a
              href="#top"
              className="flex items-center whitespace-nowrap shrink-0"
            >
              <BrandLogo size="md" surface="dark" wordmarkClassName="text-white" />
            </a>

            {/* Zone 2: Concise single-line nav links */}
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

            {/* Zone 3: Install CTA + Primary Action + Mobile Menu Trigger */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="hidden sm:block">
                <PWAInstallButton label={t('installApp')} />
              </div>
              <button
                type="button"
                onClick={user ? onOpenLearning : onExplore}
                className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
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

        {/* Mobile Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#070E1D] px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileNavOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
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
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0052CC] px-4 py-2.5 text-sm font-semibold text-white min-h-[44px]"
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
                    href="https://console.firebase.google.com/project/river-pipe-m6tvw/authentication/settings"
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
        {/* Hero — fondo de borde a borde, aprovechando el viewport con balance vertical */}
        <section className="bg-[#070E1D] text-slate-100 border-b border-slate-800/90 py-10 sm:py-12 lg:py-14 flex items-center min-h-[min(calc(100dvh-4rem),660px)]">
          <Container prose={false}>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-8 lg:gap-12 items-center">
              <div className="flex flex-col justify-center">
                <p className="text-xs font-semibold tracking-wide text-cyan-300">
                  Academia técnica interactiva · DB Academy
                </p>
                <h1 className="mt-2.5 font-display text-4xl sm:text-5xl lg:text-[3.25rem] 2xl:text-6xl font-bold tracking-tight text-white leading-[1.08] text-balance">
                  Domina habilidades técnicas con práctica interactiva paso a paso.
                </h1>
                <p className="mt-4 max-w-prose text-base leading-relaxed text-slate-300">
                  Rutas estructuradas por nivel, laboratorio interactivo de Excel con Simulador 3D, seguimiento de progreso en tiempo real y certificados verificables.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onExplore}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] px-6 py-3 text-sm font-semibold text-white transition-colors whitespace-nowrap min-h-[46px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052CC] active:scale-95"
                  >
                    <span>Empezar gratis</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => (user ? onOpenLearning() : void onSignIn())}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors whitespace-nowrap min-h-[46px] focus-visible:outline-none focus-visible:ring-2 active:scale-95 ${
                      user
                        ? 'bg-[#0052CC] hover:bg-[#0747A6] text-white focus-visible:ring-[#0052CC]'
                        : 'border border-slate-600 bg-slate-900/60 hover:bg-slate-800 text-white focus-visible:ring-slate-600'
                    }`}
                  >
                    <span>{user ? 'Ir a Mi Panel' : 'Iniciar sesión'}</span>
                  </button>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1.5 text-slate-200">
                    <Check className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Acceso libre al catálogo</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-200">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Curso de Excel Básico gratuito</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Sincronización multi-dispositivo</span>
                  </span>
                </div>
              </div>

              <div className="relative h-full min-h-[340px] lg:min-h-[410px] rounded-xl overflow-hidden border border-slate-800 bg-[#0D1930]">
                <ProductPreview />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#070E1D] via-[#070E1D]/85 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono text-cyan-300 uppercase tracking-wider">
                      Ruta destacada · Gratis
                    </p>
                    <p className="mt-0.5 font-display text-base sm:text-lg font-bold text-white">
                      Excel Básico: Fundamentos, SI y Simulador 3D
                    </p>
                  </div>
                  {excelCourse && (
                    <button
                      type="button"
                      onClick={() => onSelectCourse(excelCourse.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-900/80 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 active:scale-95"
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

        {/* Stats Strip — fondo de borde a borde, ancho limitado solo en contenido */}
        <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
          <Container>
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
              <div className="p-5 sm:p-6 flex flex-col h-full">
                <p className="font-display text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
                  {publishedCourses.length}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-none">
                  Programa activo en catálogo
                </p>
              </div>
              <div className="p-5 sm:p-6 flex flex-col h-full">
                <p className="font-display text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0052CC] dark:text-cyan-400">
                  218+
                </p>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-none">
                  Ejercicios interactivos de Excel
                </p>
              </div>
              <div className="p-5 sm:p-6 flex flex-col h-full">
                <p className="font-display text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
                  Certificados
                </p>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-none">
                  Verificables con firma hash SHA-256
                </p>
              </div>
              <div className="p-5 sm:p-6 flex flex-col h-full">
                <p className="font-display text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
                  20
                </p>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-none">
                  Lecciones en el curso de Excel
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* Rutas de Aprendizaje (Learning Paths) */}
        <section id="rutas" className="scroll-mt-20 py-10 sm:py-14">
          <Container>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="max-w-prose">
                <p className="text-xs font-semibold text-[#0052CC] dark:text-cyan-400">
                  01. Rutas de aprendizaje
                </p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 text-balance">
                  Trayectorias técnicas desde fundamentos hasta práctica profesional
                </h2>
              </div>
              <button
                type="button"
                onClick={onExplore}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0052CC] dark:text-cyan-400 hover:underline whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:underline active:scale-95"
              >
                <span>Ver todo el catálogo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Marquee Track: Excel & Analítica */}
              {excelCourse && (
                <article className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] overflow-hidden flex flex-col">
                  <div className="aspect-[16/9] w-full bg-slate-900 relative overflow-hidden">
                    <img
                      src="/assets/images/track_data_analytics_1795271913869.webp"
                      alt="Ruta de Productividad y Analítica en Excel en DB Academy"
                      width={1200}
                      height={896}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 sm:p-7 flex-1 flex flex-col">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-[#0052CC] dark:text-cyan-300">
                        Ruta Principal · {excelCourse.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{levelLabel(excelCourse.level)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{excelCourse.totalLessons} lecciones</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        Simulador 3D incluido
                      </span>
                    </div>
                    <h3 className="mt-2.5 font-display text-xl font-bold text-slate-900 dark:text-slate-50">
                      {excelCourse.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {excelCourse.description}
                    </p>
                    <div className="mt-auto pt-6 flex flex-wrap items-center justify-between gap-4">
                      <span className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-400">
                        {formatPrice(excelCourse.priceCents, excelCourse.currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectCourse(excelCourse.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] px-4 py-2.5 text-xs font-semibold text-white transition-colors min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052CC] active:scale-95"
                      >
                        <span>Explorar ruta y temario</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              )}

              {/* Secondary Tracks Stack */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {secondaryTracks.map((track) => (
                  <article
                    key={track.id}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-[#0052CC] dark:text-cyan-300">
                          {track.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{levelLabel(track.level)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{track.modules.length} módulos</span>
                      </div>
                      <h3 className="mt-2 font-display text-base font-bold text-slate-900 dark:text-slate-100">
                        {track.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
                        {track.subtitle}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {formatPrice(track.priceCents, track.currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectCourse(track.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0052CC] dark:text-cyan-400 hover:underline min-h-[36px] focus-visible:outline-none focus-visible:underline active:scale-95"
                      >
                        <span>Ver programa</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Catálogo Completo Destacado */}
        <section
          id="cursos"
          className="scroll-mt-20 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] py-10 sm:py-14"
        >
          <Container>
            <div className="max-w-prose">
              <p className="text-xs font-semibold text-[#0052CC] dark:text-cyan-400">
                02. Catálogo de cursos
              </p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 text-balance">
                Programas estructurados por módulos y evaluación práctica
              </h2>
            </div>

            <div className="mt-10 grid gap-6 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
              {publishedCourses.map((course) => (
                <article
                  key={course.id}
                  className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-[var(--dba-bg-canvas)] dark:bg-[#0B1426] overflow-hidden flex flex-col transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="aspect-video w-full bg-slate-900 overflow-hidden">
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
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <BookOpen className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-[#0052CC] dark:text-cyan-300">
                        {course.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{levelLabel(course.level)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{course.totalLessons} lecciones</span>
                    </div>
                    <h3 className="mt-2 font-display text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {course.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
                      {course.subtitle}
                    </p>
                    <div className="mt-auto pt-5 flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {formatPrice(course.priceCents, course.currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectCourse(course.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] px-3.5 py-2 text-xs font-semibold text-white transition-colors min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052CC] active:scale-95"
                      >
                        <span>Ver programa</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </section>

        {/* Metodología y Capacidades Reales */}
        <section id="metodologia" className="scroll-mt-20 py-10 sm:py-14">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 max-w-prose">
                <p className="text-xs font-semibold text-[#0052CC] dark:text-cyan-400">
                  03. Metodología DB Academy
                </p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 text-balance">
                  De la teoría al laboratorio en una sola plataforma
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Cada programa combina lecciones guiadas, validación práctica inmediata, seguimiento de avance en tiempo real y emisión automática de certificados al completar el 100% del currículo.
                </p>

                <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-4 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Progresión guiada por capítulos y módulos
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Cada capítulo y módulo se desbloquea de forma secuencial al completar sus prácticas y evaluaciones, asegurando dominio real antes de avanzar.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: Box,
                    title: 'Simulador 3D y Laboratorio Excel',
                    body: 'Practica fórmulas lógicas y matemáticas (=SI, =SI.ANIDADO, =CONTAR.SI, =SUMAR.SI) con validación instantánea.',
                  },
                  {
                    icon: Layers,
                    title: 'Progreso sincronizado en vivo',
                    body: 'Tu avance por módulo, calendario de entregas y notas se mantienen sincronizados entre tus dispositivos.',
                  },
                  {
                    icon: Award,
                    title: 'Certificados con firma SHA-256',
                    body: 'Al completar un programa obtienes un certificado PDF con código público verificable.',
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
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-6"
                    >
                      <Icon className="w-5 h-5 text-[#0052CC] dark:text-cyan-400" />
                      <h3 className="mt-4 font-display text-base font-bold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
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
          className="scroll-mt-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] py-10 sm:py-14"
        >
          <Container prose={true}>
            <p className="text-xs font-semibold text-[#0052CC] dark:text-cyan-400">
              04. Preguntas frecuentes
            </p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Información antes de comenzar
            </h2>
            <div className="mt-6 divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-[var(--dba-bg-canvas)] dark:bg-[#0B1426] px-5">
              {[
                {
                  q: '¿Necesito cuenta para explorar los cursos y temarios?',
                  a: 'No. Puedes revisar todo el catálogo, las rutas de aprendizaje y el temario completo de cada programa sin iniciar sesión.',
                },
                {
                  q: '¿Cómo funciona el curso gratuito de Excel Básico?',
                  a: 'Puedes inscribirte sin costo y practicar directamente en el Laboratorio Interactivo de Excel y el Simulador 3D de decisiones lógicas.',
                },
                {
                  q: '¿Cómo se verifican los certificados emitidos?',
                  a: 'Cada certificado emitido al alcanzar el 100% incluye un código único verificable en la sección de Certificados y descarga en PDF.',
                },
              ].map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="flex min-h-[28px] cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-slate-900 dark:text-slate-100 [&::-webkit-details-marker]:hidden">
                    <span>{item.q}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </Container>
        </section>

        {/* Cierre Oscuro CTA — fondo de borde a borde */}
        <section className="bg-[#070E1D] text-slate-100 py-10 sm:py-12 border-t border-slate-800">
          <Container>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-prose">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white text-balance">
                  Comienza tu formación técnica hoy en DB Academy
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  Accede con tu cuenta de Google o explora el catálogo abierto desde cualquier dispositivo.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={user ? onOpenLearning : onExplore}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] px-5 py-3 text-sm font-semibold text-white transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052CC] active:scale-95"
                >
                  <span>{user ? 'Ir a Mi Aprendizaje' : 'Ver catálogo'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                {!user && (
                  <button
                    type="button"
                    onClick={() => void onSignIn()}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-600 hover:bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 active:scale-95"
                  >
                    <span>Iniciar sesión</span>
                  </button>
                )}
              </div>
            </div>
          </Container>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-[#050914] text-slate-400">
        <Container>
          <div className="py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrandLogo size="sm" surface="dark" wordmarkClassName="text-white" />
              <span className="text-xs text-slate-400">· Formación técnica en tiempo real</span>
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

/**
 * Vista previa del producto dentro de un marco tipo ventana de navegador.
 * Muestra una hoja de cálculo con la fórmula =SI(B2>=60;"Aprobado";"Reprobado").
 * TODO: Reemplazar por una captura real del Simulador 3D o del laboratorio de Excel.
 */
function ProductPreview() {
  const rows = [
    { row: 2, student: 'Laura Mendoza', score: 92, attendance: '98%', formula: '=SI(B2>=60;"Aprobado";"Reprobado")', result: 'Aprobado', pass: true },
    { row: 3, student: 'Carlos Ortega', score: 85, attendance: '95%', formula: '=SI(B3>=60;"Aprobado";"Reprobado")', result: 'Aprobado', pass: true },
    { row: 4, student: 'Sofía Paredes', score: 48, attendance: '82%', formula: '=SI(B4>=60;"Aprobado";"Reprobado")', result: 'Reprobado', pass: false },
    { row: 5, student: 'Mateo Herrera', score: 74, attendance: '90%', formula: '=SI(B5>=60;"Aprobado";"Reprobado")', result: 'Aprobado', pass: true },
    { row: 6, student: 'Elena Ríos', score: 56, attendance: '88%', formula: '=SI(B6>=60;"Aprobado";"Reprobado")', result: 'Reprobado', pass: false },
  ];

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex-1 flex flex-col bg-[#0F172A] border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
        {/* Barra superior de ventana */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-[#1E293B]/60">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
            <span className="ml-2 text-[11px] font-mono text-slate-300">
              Excel_Laboratorio — DB Academy
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">fx Evaluador en vivo</span>
        </div>

        {/* Barra de fórmulas activa */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-800 bg-[#0B1325] font-mono text-xs">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-semibold">D2</span>
          <span className="text-emerald-400 font-serif italic font-bold">fx</span>
          <span className="text-cyan-300 truncate">{'=SI(B2>=60;"Aprobado";"Reprobado")'}</span>
        </div>

        {/* Hoja de cálculo con datos completos */}
        <div className="flex-1 p-3 pb-20 bg-[#070E1D] overflow-hidden flex flex-col">
          <div className="flex-1 border border-slate-800 rounded-lg bg-[#020617] overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="bg-[#0F172A] border-b border-slate-800 text-slate-300">
                  <th className="border-r border-slate-800 px-2 py-1.5 text-center w-8">#</th>
                  <th className="border-r border-slate-800 px-3 py-1.5 text-left">A · Estudiante</th>
                  <th className="border-r border-slate-800 px-3 py-1.5 text-center">B · Nota</th>
                  <th className="border-r border-slate-800 px-3 py-1.5 text-center">C · Asist.</th>
                  <th className="px-3 py-1.5 text-center">D · Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.row}
                    className={`border-b border-slate-800/80 text-slate-200 ${
                      i === 0 ? 'bg-blue-950/30' : i % 2 === 1 ? 'bg-[#0F172A]/40' : ''
                    }`}
                  >
                    <td className="border-r border-slate-800 px-2 py-2 text-center text-slate-300">
                      {r.row}
                    </td>
                    <td className="border-r border-slate-800 px-3 py-2 text-left font-sans text-slate-100 truncate">
                      {r.student}
                    </td>
                    <td className="border-r border-slate-800 px-3 py-2 text-center text-cyan-300 tabular-nums">
                      {r.score}
                    </td>
                    <td className="border-r border-slate-800 px-3 py-2 text-center text-slate-300 tabular-nums">
                      {r.attendance}
                    </td>
                    <td
                      className={`px-3 py-2 text-center font-semibold ${
                        r.pass ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {r.result}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
