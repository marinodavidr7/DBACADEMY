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
    <div id="top" className="min-h-screen bg-[var(--dba-bg-canvas)] text-[var(--dba-text-primary)]">
      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070E1D]/95 backdrop-blur text-slate-100">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            DB Academy
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

          {/* Zone 3: 1 Primary Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={user ? onOpenLearning : onExplore}
              className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
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
        )}
      </header>

      {authError && (
        <div className="bg-red-950 border-b border-red-800 text-red-100 px-4 py-3 text-xs">
          <div className="mx-auto max-w-7xl flex items-start justify-between gap-4">
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
        </div>
      )}

      <main>
        {/* Dark Technological Hero */}
        <section className="bg-[#070E1D] text-slate-100 border-b border-slate-800/90">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center">
                <p className="text-xs font-semibold tracking-wide text-cyan-300">
                  Academia técnica interactiva · DB Academy
                </p>
                <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.5rem)] font-bold tracking-tight text-white leading-[1.08] text-balance">
                  Domina habilidades técnicas con práctica guiada en vivo.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300">
                  Rutas estructuradas por nivel, laboratorio interactivo de Excel con Simulador 3D, seguimiento de progreso en tiempo real y certificados verificables.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onExplore}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] px-6 py-3 text-sm font-semibold text-white transition-colors whitespace-nowrap min-h-[46px]"
                  >
                    <span>Explorar cursos</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => (user ? onOpenLearning() : void onSignIn())}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-900/60 hover:bg-slate-800 px-6 py-3 text-sm font-semibold text-white transition-colors whitespace-nowrap min-h-[46px]"
                  >
                    <span>{user ? 'Ir a Mi Panel' : 'Iniciar sesión con Google'}</span>
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-300">
                  <span>Acceso libre al catálogo</span>
                  <span aria-hidden="true">·</span>
                  <span>Curso de Excel Básico gratuito</span>
                  <span aria-hidden="true">·</span>
                  <span>Sincronización multi-dispositivo</span>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative h-full min-h-[280px] lg:min-h-[420px] rounded-xl overflow-hidden border border-slate-800 bg-[#0D1930]">
                  <img
                    src="/src/assets/images/hero_db_academy_tech_1795271913703.jpg"
                    alt="Estudiantes trabajando en el laboratorio tecnológico de DB Academy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070E1D]/90 via-[#070E1D]/30 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-mono text-cyan-300">Ruta destacada</p>
                      <p className="mt-1 font-display text-lg font-semibold text-white">
                        Excel Básico: Fundamentos, SI y Simulador 3D
                      </p>
                    </div>
                    {excelCourse && (
                      <button
                        type="button"
                        onClick={() => onSelectCourse(excelCourse.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 hover:bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
                      >
                        <span>Ver programa</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full-Width 4-Column Verifiable Metrics Strip */}
        <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
          <div className="mx-auto max-w-7xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
            <div className="p-6 sm:p-8">
              <p className="font-display text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
                {publishedCourses.length}
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Programas activos en catálogo
              </p>
            </div>
            <div className="p-6 sm:p-8">
              <p className="font-display text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0052CC] dark:text-cyan-400">
                218+
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Ejercicios interactivos de Excel
              </p>
            </div>
            <div className="p-6 sm:p-8">
              <p className="font-display text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
                SHA-256
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Certificados verificables en PDF
              </p>
            </div>
            <div className="p-6 sm:p-8">
              <p className="font-display text-xl sm:text-2xl font-bold font-mono text-slate-700 dark:text-slate-200">
                [COMPLETAR]
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Estudiantes egresados de DB Academy
              </p>
            </div>
          </div>
        </section>

        {/* Rutas de Aprendizaje (Learning Paths) */}
        <section id="rutas" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="max-w-2xl">
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
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0052CC] dark:text-cyan-400 hover:underline whitespace-nowrap shrink-0"
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
                      src="/src/assets/images/track_data_analytics_1795271913869.jpg"
                      alt="Ruta de Productividad y Analítica en Excel en DB Academy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 sm:p-7 flex-1 flex flex-col">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-[#0052CC] dark:text-cyan-400">
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
                        className="inline-flex items-center gap-2 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] px-4 py-2.5 text-xs font-semibold text-white transition-colors min-h-[42px]"
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
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-[#0052CC] dark:text-cyan-400">
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
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0052CC] dark:text-cyan-400 hover:underline min-h-[36px]"
                      >
                        <span>Ver programa</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Catálogo Completo Destacado */}
        <section
          id="cursos"
          className="scroll-mt-20 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] py-16 sm:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-[#0052CC] dark:text-cyan-400">
                02. Catálogo de cursos
              </p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 text-balance">
                Programas estructurados por módulos y evaluación práctica
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        loading="lazy"
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
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-[#0052CC] dark:text-cyan-400">
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
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] px-3.5 py-2 text-xs font-semibold text-white transition-colors min-h-[40px]"
                      >
                        <span>Ver programa</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Metodología y Capacidades Reales */}
        <section id="metodologia" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold text-[#0052CC] dark:text-cyan-400">
                03. Metodología DB Academy
              </p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 text-balance">
                De la teoría al laboratorio en una sola plataforma
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Cada programa combina lecciones guiadas, validación práctica inmediata, seguimiento de avance en tiempo real y emisión automática de certificados al completar el 100% del currículo.
              </p>

              <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 space-y-2">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Testimonios y alianzas institucionales
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  [COMPLETAR: Agrega aquí un testimonio verificado de un estudiante o institución aliada de DB Academy con nombre completo y rol.]
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
        </section>

        {/* Preguntas Frecuentes */}
        <section
          id="preguntas"
          className="scroll-mt-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] py-16 sm:py-20"
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold text-[#0052CC] dark:text-cyan-400">
              04. Preguntas frecuentes
            </p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Información antes de comenzar
            </h2>
            <div className="mt-8 divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-[var(--dba-bg-canvas)] dark:bg-[#0B1426] px-5">
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
          </div>
        </section>

        {/* Cierre Oscuro CTA */}
        <section className="bg-[#070E1D] text-slate-100 py-14 sm:py-16 border-t border-slate-800">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
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
                className="inline-flex items-center gap-2 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] px-5 py-3 text-sm font-semibold text-white transition-colors min-h-[44px]"
              >
                <span>{user ? 'Ir a Mi Aprendizaje' : 'Ver catálogo'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {!user && (
                <button
                  type="button"
                  onClick={() => void onSignIn()}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-600 hover:bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition-colors min-h-[44px]"
                >
                  <span>Iniciar sesión</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-[#050914] text-slate-400">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-display text-sm font-bold text-white">DB Academy</span>
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
              aria-label="Cambiar tema claro u oscuro"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
