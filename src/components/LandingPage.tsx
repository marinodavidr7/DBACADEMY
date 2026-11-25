import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Mail,
  MapPin,
  Menu,
  Phone,
  Sparkles,
  UserCheck,
  Users,
  Video,
  X,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { useSeasonalTheme } from '../hooks/useSeasonalTheme';
import { FIREBASE_AUTH_SETTINGS_URL } from '../firebase';
import { legalDocumentPath } from '../services/legalDocuments';
import type { Course } from '../types';
import { formatCurrency } from '../utils/currency';
import { normalizarUrlImagen } from '../utils/imageUtils';
import { BrandLogo } from './ui/BrandLogo';
import { Container } from './ui/Container';
import { PWAInstallButton } from './PWAInstallButton';
import { SnowEffect } from './ui/SnowEffect';
import {
  getLandingConfig,
  subscribeLandingConfig,
  type LandingConfig,
} from '../services/landingConfigService';

interface LandingPageProps {
  onExplore: () => void;
  onSelectCourse: (courseId: string) => void;
  onOpenLearning: () => void;
  onSignIn: () => void | Promise<void>;
}

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
  const { user, courses, enrollments, authError, clearAuthError, t } = usePlatform();
  const seasonalTheme = useSeasonalTheme();

  // Configuración completa y editable desde el panel administrativo
  const [config, setConfig] = useState<LandingConfig>(() => getLandingConfig());

  // Diciembre se activa solo por fecha. El forzado es exclusivo del panel de administrador.
  const isChristmas = seasonalTheme.isChristmas || config.christmasMode;

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Stepper interactivo para "¡Regístrate!"
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);
  const [regData, setRegData] = useState({
    firstName: '',
    lastName: '',
    cedula: '',
    email: '',
    phone: '',
    track: 'tech',
    city: 'Santo Domingo',
  });
  const [regSuccess, setRegSuccess] = useState(false);

  useEffect(() => {
    const unsub = subscribeLandingConfig((updated) => {
      setConfig(updated);
    });
    return () => unsub();
  }, []);

  const publishedCourses = courses.filter((c) => c.published);
  const featuredCourse = publishedCourses[0] || null;

  const levelLabel = (level: Course['level']) => {
    if (level === 'beginner') return t('beginner');
    if (level === 'intermediate') return t('intermediate');
    return t('advanced');
  };

  const navLinks = [
    { href: '#top', label: config.navHomeLabel, visible: true },
    { href: '#acerca', label: config.navAboutLabel, visible: config.showSectionAbout },
    { href: '#rutas', label: config.navTracksLabel, visible: config.showSectionTracks },
    { href: '#cursos', label: config.navCoursesLabel, visible: config.showSectionCourses },
    { href: '#eventos', label: config.navEventsLabel, visible: config.showSectionEvents },
    { href: '#registro', label: config.navRegisterLabel, visible: config.showSectionRegister },
    { href: '#faq', label: config.navFaqLabel, visible: config.showSectionFaq },
  ].filter((link) => link.visible);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (regStep === 1) {
      if (!regData.firstName.trim() || !regData.lastName.trim()) {
        alert('Por favor introduce tu nombre y apellidos.');
        return;
      }
      setRegStep(2);
    } else if (regStep === 2) {
      if (!regData.email.trim()) {
        alert('Por favor introduce tu correo electrónico.');
        return;
      }
      setRegStep(3);
    } else {
      setRegSuccess(true);
    }
  };

  return (
    <div id="top" className="min-h-[100dvh] overflow-x-hidden bg-[var(--dba-bg-canvas)] text-[var(--dba-text-primary)] relative">
      {/* Efecto de Nieve (Canvas interactivo suave en Modo Navidad) */}
      {isChristmas && config.showSnow && <SnowEffect />}

      {/* Banner Superior */}
      {config.showSectionBanner && config.bannerActive ? (
        <div className="bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)] text-xs font-semibold py-2 px-4 shadow-sm border-b border-[var(--dba-accent-hover)] relative z-30">
          <Container>
            <div className="flex items-center justify-between gap-4 text-center sm:text-left">
              <span className="mx-auto sm:mx-0">{config.bannerText}</span>
              {config.bannerLinkText && (
                <a
                  href={config.bannerLinkUrl || '#rutas'}
                  className="hidden sm:inline-flex items-center gap-1 font-bold underline hover:opacity-85 whitespace-nowrap"
                >
                  <span>{config.bannerLinkText}</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              )}
            </div>
          </Container>
        </div>
      ) : null}

      {/* Cinta estacional: nieve en diciembre y fechas patrias dominicanas */}
      {seasonalTheme.id !== 'default' && (
        <div
          className="relative z-30 border-b border-[var(--dba-border)] bg-[var(--dba-bg-elevated)] px-4 py-1.5 text-center text-[11px] font-medium text-[var(--dba-text-secondary)] sm:text-xs"
          role="note"
          aria-label={seasonalTheme.label}
        >
          {seasonalTheme.isPreview && (
            <span className="mr-2 rounded bg-[var(--dba-accent)] px-1.5 py-0.5 font-bold uppercase tracking-wide text-[var(--dba-accent-foreground)]">
              Vista previa admin
            </span>
          )}
          <span className="font-semibold text-[var(--dba-accent-ink)]">{seasonalTheme.label}</span>
          <span className="mx-2 opacity-50">·</span>
          {seasonalTheme.isChristmas ? config.christmasGreeting : seasonalTheme.greeting}
        </div>
      )}

      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/90 bg-[var(--dba-bg-hero)]/95 backdrop-blur text-zinc-100 safe-pt transition-colors">
        <Container>
          <div className="flex h-16 items-center justify-between gap-6">
            <a href="#top" className="flex items-center whitespace-nowrap shrink-0 group">
              <BrandLogo
                size="md"
                surface="dark"
                wordmarkClassName="text-white group-hover:text-amber-300 transition-colors"
                christmasMode={isChristmas}
              />
            </a>

            <nav
              aria-label="Navegación principal"
              className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-300"
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="hover:text-amber-300 transition-colors whitespace-nowrap"
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
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-4 py-2 text-xs font-semibold text-[var(--dba-accent-foreground)] transition-all shadow-sm whitespace-nowrap shrink-0 min-h-[40px] active:scale-95"
              >
                <span>{user ? config.navCtaLearningText : config.navCtaExploreText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setMobileNavOpen((o) => !o)}
                aria-label={mobileNavOpen ? 'Cerrar menú' : 'Abrir menú'}
                className="lg:hidden p-2 rounded-lg text-slate-200 hover:bg-slate-800 min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </Container>

        {mobileNavOpen && (
          <div className="lg:hidden border-t border-zinc-800 bg-[var(--dba-bg-hero)] px-4 py-4 space-y-2 animate-in fade-in slide-in-from-top-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileNavOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  if (user) onOpenLearning();
                  else onExplore();
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-4 py-2.5 text-sm font-semibold text-[var(--dba-accent-foreground)] min-h-[44px]"
              >
                <span>{user ? config.navCtaLearningText : config.navCtaExploreText}</span>
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
        {/* HERO SECTION — 100% Configurable */}
        <section className="bg-[var(--dba-bg-hero)] text-zinc-100 border-b border-zinc-800/90 py-12 sm:py-16 lg:py-20 relative overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--dba-accent)]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <Container prose={false}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7 flex flex-col justify-center">
                {/* Badge Superior */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold w-fit mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{config.heroBadge}</span>
                </div>

                {/* Titular Principal H1 */}
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] text-balance">
                  {config.heroTitle}
                </h1>

                {/* Subtítulo Descriptivo */}
                <p className="mt-5 text-base sm:text-lg leading-relaxed text-zinc-300 max-w-2xl">
                  {config.heroSubtitle}
                </p>

                {/* CTAs */}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <a
                    href="#rutas"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-6 py-3.5 text-sm font-bold text-[var(--dba-accent-foreground)] shadow-lg transition-all whitespace-nowrap min-h-[48px] active:scale-95"
                  >
                    <span>{config.heroCtaPrimary}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => (user ? onOpenLearning() : void onSignIn())}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold transition-all whitespace-nowrap min-h-[48px] active:scale-95 ${
                      user
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                        : 'border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-white'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    <span>{user ? 'Mi Campus Virtual' : config.heroCtaSecondary}</span>
                  </button>
                </div>

                {/* Sellos de Confianza (Chips) */}
                <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs text-zinc-300">
                  {config.heroTrustChips.map((chip, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 text-zinc-200">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{chip}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Lado Derecho: Tarjeta Multimedia / Campus Preview */}
              <div className="lg:col-span-5 relative">
                <div className="rounded-2xl border border-zinc-800 bg-[var(--dba-bg-hero-surface)] p-2 shadow-2xl overflow-hidden group">
                  <div className="relative aspect-video sm:aspect-[4/3] rounded-xl overflow-hidden bg-zinc-900">
                    {featuredCourse?.coverImage ? (
                      <img
                        src={normalizarUrlImagen(featuredCourse.coverImage)}
                        alt="Campus DB Academy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-500">
                        <BookOpen className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                    {/* Insignia en vivo */}
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-md px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{config.campusBadge}</span>
                    </div>

                    {/* Tarjeta de curso destacado abajo */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                        {featuredCourse ? `Programa Destacado · ${formatPrice(featuredCourse.priceCents, featuredCourse.currency)}` : config.campusSubtext}
                      </p>
                      <h3 className="mt-1 font-display text-lg font-bold text-white leading-tight">
                        {featuredCourse?.title || 'Excel para el Trabajo Diario y Automatización'}
                      </h3>
                      {featuredCourse && (
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-zinc-300">
                            {featuredCourse.modules.length} módulos · Simulador 3D
                          </span>
                          <button
                            type="button"
                            onClick={() => onSelectCourse(featuredCourse.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)] px-3 py-1.5 text-xs font-bold shadow hover:bg-[var(--dba-accent-hover)] transition-all"
                          >
                            <span>Ver programa</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* MÉTRICAS DE IMPACTO — Talento Digital Counters Strip */}
        {config.showSectionStats && (
          <section className="border-b border-[var(--dba-border)] bg-[var(--dba-bg-surface)] py-8 sm:py-10">
            <Container>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                {config.stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-5 text-center flex flex-col justify-center shadow-xs hover:border-[var(--dba-accent-ink)] transition-colors"
                  >
                    <p className="font-display text-3xl sm:text-4xl lg:text-5xl font-black font-mono tabular-nums text-[var(--dba-accent-ink)]">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-xs sm:text-sm font-semibold text-[var(--dba-text-primary)] leading-snug">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* ACERCA DE DB ACADEMY & METODOLOGÍA */}
        {config.showSectionAbout && (
          <section id="acerca" className="py-14 sm:py-18 bg-[var(--dba-bg-canvas)] border-b border-[var(--dba-border)]">
            <Container>
              <div className="max-w-3xl mx-auto text-center space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--dba-accent-ink)] font-mono">
                  {config.aboutBadge}
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--dba-text-primary)]">
                  {config.aboutTitle}
                </h2>
                <p className="text-sm sm:text-base text-[var(--dba-text-secondary)] leading-relaxed">
                  {config.aboutDescription}
                </p>
                <p className="text-xs sm:text-sm text-[var(--dba-text-secondary)] leading-relaxed bg-[var(--dba-bg-surface)] border border-[var(--dba-border)] p-4 rounded-xl font-medium">
                  {config.aboutHighlightText}
                </p>
              </div>

              {/* 4 Pilares de Metodología */}
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {config.aboutPillars.map((pill, i) => {
                  const icons = [BookOpen, Cpu, Users, Award];
                  const Icon = icons[i] || BookOpen;
                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-6 space-y-3 shadow-xs hover:shadow-md transition-shadow"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[var(--dba-accent)]/15 text-[var(--dba-accent-ink)] flex items-center justify-center font-bold">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-display text-base font-bold text-[var(--dba-text-primary)]">
                        {pill.title}
                      </h3>
                      <p className="text-xs text-[var(--dba-text-secondary)] leading-relaxed">
                        {pill.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Container>
          </section>
        )}

        {/* RUTAS DE APRENDIZAJE — Inspirado en Talento Digital 2 Tracks */}
        {config.showSectionTracks && (
          <section id="rutas" className="py-16 sm:py-20 bg-[var(--dba-bg-surface)] border-b border-[var(--dba-border)]">
            <Container>
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--dba-accent-ink)] font-mono">
                  {config.tracksBadge}
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--dba-text-primary)]">
                  {config.tracksTitle}
                </h2>
                <p className="text-sm text-[var(--dba-text-secondary)]">
                  {config.tracksSubtitle}
                </p>
              </div>

              {/* Dos Grandes Tarjetas de Rutas Formativas */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                {config.tracks.map((track, idx) => (
                  <div
                    key={track.id}
                    className="rounded-2xl border-2 border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-7 sm:p-9 flex flex-col justify-between space-y-6 hover:border-[var(--dba-accent)] transition-colors shadow-sm relative overflow-hidden group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[var(--dba-accent)]/20 text-[var(--dba-accent-ink)]">
                          {track.badge}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          Ruta #{idx + 1}
                        </span>
                      </div>

                      <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--dba-text-primary)] leading-tight">
                        {track.title}
                      </h3>

                      <p className="text-sm text-[var(--dba-text-secondary)] leading-relaxed">
                        {track.description}
                      </p>

                      <div className="pt-2 flex flex-wrap gap-2">
                        {track.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--dba-bg-surface)] border border-[var(--dba-border)] text-[var(--dba-text-secondary)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--dba-border)]">
                      <a
                        href="#cursos"
                        className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-5 py-3.5 text-sm font-bold text-[var(--dba-accent-foreground)] transition-colors shadow-sm active:scale-95"
                      >
                        <span>{track.buttonText}</span>
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* CATÁLOGO DE CURSOS REALES */}
        {config.showSectionCourses && (
          <section id="cursos" className="py-16 sm:py-20 bg-[var(--dba-bg-canvas)] border-b border-[var(--dba-border)]">
            <Container>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--dba-accent-ink)] font-mono">
                    {config.coursesBadge}
                  </span>
                  <h2 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold text-[var(--dba-text-primary)]">
                    {config.coursesTitle}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--dba-text-secondary)]">
                    {config.coursesSubtitle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onExplore}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--dba-accent-ink)] hover:underline whitespace-nowrap self-start sm:self-auto"
                >
                  <span>{config.coursesCatalogLinkText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid gap-6 sm:gap-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {publishedCourses.map((course) => {
                  const enr = enrollments.find((e) => e.courseId === course.id);
                  const isEnrolled = Boolean(enr);

                  return (
                    <article
                      key={course.id}
                      className="group rounded-2xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] overflow-hidden flex flex-col transition-all hover:border-[var(--dba-border-strong)] hover:shadow-md"
                    >
                      <div className="aspect-video w-full bg-zinc-900 overflow-hidden relative">
                        {course.coverImage ? (
                          <img
                            src={normalizarUrlImagen(course.coverImage)}
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-500">
                            <BookOpen className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-[var(--dba-text-secondary)]">
                            <span className="font-semibold text-[var(--dba-accent-ink)]">
                              {course.category}
                            </span>
                            <span>·</span>
                            <span>{levelLabel(course.level)}</span>
                            <span>·</span>
                            <span className="tabular-nums">{course.totalLessons} lecciones</span>
                          </div>

                          <h3 className="mt-2.5 font-display text-lg font-bold text-[var(--dba-text-primary)] leading-snug">
                            {course.title}
                          </h3>

                          <p className="mt-2 text-xs leading-relaxed text-[var(--dba-text-secondary)] line-clamp-2">
                            {course.subtitle}
                          </p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-[var(--dba-border)] space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-base font-bold tabular-nums text-[var(--dba-text-primary)]">
                              {formatPrice(course.priceCents, course.currency)}
                            </span>
                            {isEnrolled && (
                              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-300">
                                Inscrito ({enr?.progressPercent}%)
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => onSelectCourse(course.id)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--dba-border-strong)] px-3 py-2 text-xs font-semibold text-[var(--dba-text-primary)] hover:bg-stone-200/50 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap min-h-[40px]"
                            >
                              <span>Ver programa</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onSelectCourse(course.id);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-3 py-2 text-xs font-bold text-[var(--dba-accent-foreground)] transition-colors whitespace-nowrap min-h-[40px] active:scale-95"
                            >
                              <span>{isEnrolled ? 'Continuar' : 'Inscribirse'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Container>
          </section>
        )}

        {/* EVENTOS Y MASTERCLASSES — Estilo Talento Digital */}
        {config.showSectionEvents && (
          <section id="eventos" className="py-16 sm:py-20 bg-[var(--dba-bg-surface)] border-b border-[var(--dba-border)]">
            <Container>
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--dba-accent-ink)] font-mono">
                  {config.eventsBadge}
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--dba-text-primary)]">
                  {config.eventsTitle}
                </h2>
                <p className="text-sm text-[var(--dba-text-secondary)]">
                  {config.eventsSubtitle}
                </p>
              </div>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                {config.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-2xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-6 flex flex-col justify-between space-y-5 shadow-xs hover:border-[var(--dba-accent-ink)] transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300">
                          <Video className="w-3 h-3" />
                          <span>{ev.mode}</span>
                        </span>
                        <span className="text-xs text-[var(--dba-text-secondary)] font-mono">
                          {ev.badge}
                        </span>
                      </div>

                      <h3 className="font-display text-lg font-bold text-[var(--dba-text-primary)] leading-snug">
                        {ev.title}
                      </h3>

                      <div className="space-y-1.5 text-xs text-[var(--dba-text-secondary)]">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[var(--dba-accent-ink)]" />
                          <span>{ev.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-[var(--dba-accent-ink)]" />
                          <span>{ev.speaker}</span>
                        </div>
                      </div>
                    </div>

                    <a
                      href="#registro"
                      className="inline-flex items-center justify-center gap-2 w-full rounded-lg border border-[var(--dba-border-strong)] bg-[var(--dba-bg-surface)] hover:bg-[var(--dba-accent)] hover:text-[var(--dba-accent-foreground)] px-4 py-2.5 text-xs font-bold transition-colors"
                    >
                      <span>{ev.buttonText || 'Reservar cupo gratis'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* SECCIÓN "¡REGÍSTRATE!" — Stepper Interactivo */}
        {config.showSectionRegister && (
          <section id="registro" className="py-16 sm:py-20 bg-[var(--dba-bg-canvas)] border-b border-[var(--dba-border)]">
            <Container>
              <div className="max-w-2xl mx-auto text-center space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--dba-accent-ink)] font-mono">
                  {config.registerBadge}
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--dba-text-primary)]">
                  {config.registerTitle}
                </h2>
                <p className="text-sm text-[var(--dba-text-secondary)]">
                  {config.registerSubtitle}
                </p>
              </div>

              {/* Stepper Card */}
              <div className="mt-10 max-w-xl mx-auto rounded-2xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-6 sm:p-8 shadow-md">
                {regSuccess ? (
                  <div className="text-center py-6 space-y-4 animate-in fade-in">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold font-display text-[var(--dba-text-primary)]">
                      {config.registerSuccessTitle}
                    </h3>
                    <p className="text-sm text-[var(--dba-text-secondary)] max-w-md mx-auto">
                      {config.registerSuccessDesc} (Estudiante: <strong>{regData.firstName} {regData.lastName}</strong>).
                    </p>
                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => void onSignIn()}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)] px-6 py-3 text-sm font-bold shadow hover:bg-[var(--dba-accent-hover)] transition-all"
                      >
                        <span>Entrar al Campus Ahora</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRegSuccess(false);
                          setRegStep(1);
                        }}
                        className="text-xs text-[var(--dba-text-secondary)] underline hover:text-[var(--dba-text-primary)]"
                      >
                        Hacer otro registro
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-6">
                    {/* Stepper Header Pills */}
                    <div className="flex items-center justify-between border-b border-[var(--dba-border)] pb-4">
                      {[
                        { step: 1, label: 'Datos Personales' },
                        { step: 2, label: 'Contacto & Ruta' },
                        { step: 3, label: 'Confirmación' },
                      ].map((s) => (
                        <div
                          key={s.step}
                          className={`flex items-center gap-2 text-xs font-semibold ${
                            regStep === s.step
                              ? 'text-[var(--dba-accent-ink)]'
                              : regStep > s.step
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              regStep === s.step
                                ? 'bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)]'
                                : regStep > s.step
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-200 dark:bg-zinc-800 text-slate-500'
                            }`}
                          >
                            {regStep > s.step ? '✓' : s.step}
                          </span>
                          <span className="hidden sm:inline">{s.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Paso 1: Datos Personales */}
                    {regStep === 1 && (
                      <div className="space-y-4 animate-in fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-[var(--dba-text-secondary)] mb-1">
                              Nombres *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Juan Carlos"
                              value={regData.firstName}
                              onChange={(e) => setRegData({ ...regData, firstName: e.target.value })}
                              className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3.5 py-2.5 text-xs text-[var(--dba-text-primary)]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[var(--dba-text-secondary)] mb-1">
                              Apellidos *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Pérez Gómez"
                              value={regData.lastName}
                              onChange={(e) => setRegData({ ...regData, lastName: e.target.value })}
                              className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3.5 py-2.5 text-xs text-[var(--dba-text-primary)]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-[var(--dba-text-secondary)] mb-1">
                              Cédula / Documento (RD)
                            </label>
                            <input
                              type="text"
                              placeholder="001-0000000-0"
                              value={regData.cedula}
                              onChange={(e) => setRegData({ ...regData, cedula: e.target.value })}
                              className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3.5 py-2.5 text-xs font-mono text-[var(--dba-text-primary)]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[var(--dba-text-secondary)] mb-1">
                              Ciudad / Municipio en RD
                            </label>
                            <select
                              value={regData.city}
                              onChange={(e) => setRegData({ ...regData, city: e.target.value })}
                              className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3.5 py-2.5 text-xs text-[var(--dba-text-primary)]"
                            >
                              <option value="Santo Domingo">Santo Domingo (D.N.)</option>
                              <option value="Santo Domingo Este">Santo Domingo Este</option>
                              <option value="Santo Domingo Oeste">Santo Domingo Oeste</option>
                              <option value="Santiago">Santiago de los Caballeros</option>
                              <option value="San Cristóbal">San Cristóbal</option>
                              <option value="La Vega">La Vega</option>
                              <option value="Puerto Plata">Puerto Plata</option>
                              <option value="Otra provincia">Otra provincia</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <button
                            type="submit"
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-5 py-3 text-sm font-bold text-[var(--dba-accent-foreground)] transition-all shadow-sm"
                          >
                            <span>Siguiente: Contacto & Ruta</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Paso 2: Información de Contacto y Ruta */}
                    {regStep === 2 && (
                      <div className="space-y-4 animate-in fade-in">
                        <div>
                          <label className="block text-xs font-semibold text-[var(--dba-text-secondary)] mb-1">
                            Correo Electrónico *
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="tu.correo@ejemplo.com"
                            value={regData.email}
                            onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                            className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3.5 py-2.5 text-xs text-[var(--dba-text-primary)]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[var(--dba-text-secondary)] mb-1">
                            Teléfono / WhatsApp
                          </label>
                          <input
                            type="tel"
                            placeholder="+1 (809) 000-0000"
                            value={regData.phone}
                            onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                            className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3.5 py-2.5 text-xs text-[var(--dba-text-primary)]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[var(--dba-text-secondary)] mb-1">
                            ¿Qué Ruta de Aprendizaje te interesa?
                          </label>
                          <select
                            value={regData.track}
                            onChange={(e) => setRegData({ ...regData, track: e.target.value })}
                            className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3.5 py-2.5 text-xs text-[var(--dba-text-primary)]"
                          >
                            <option value="tech">Ruta 1: Sector Tech & Analítica de Datos (Empleabilidad)</option>
                            <option value="business">Ruta 2: Emprendimiento, Negocios & Productividad</option>
                            <option value="excel">Especialización en Excel Profesional y Simulador 3D</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setRegStep(1)}
                            className="w-1/3 rounded-xl border border-[var(--dba-border-strong)] py-3 text-xs font-semibold text-[var(--dba-text-secondary)] hover:bg-stone-200/50 dark:hover:bg-zinc-800"
                          >
                            Volver
                          </button>
                          <button
                            type="submit"
                            className="w-2/3 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] py-3 text-sm font-bold text-[var(--dba-accent-foreground)] shadow-sm"
                          >
                            <span>Siguiente: Revisión</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Paso 3: Confirmación y Envío */}
                    {regStep === 3 && (
                      <div className="space-y-4 animate-in fade-in">
                        <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-4 space-y-2 text-xs">
                          <p className="font-bold text-sm text-[var(--dba-text-primary)] mb-2">
                            Resumen de Registro
                          </p>
                          <div className="flex justify-between py-1 border-b border-[var(--dba-border)]">
                            <span className="text-[var(--dba-text-secondary)]">Estudiante:</span>
                            <span className="font-semibold">{regData.firstName} {regData.lastName}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[var(--dba-border)]">
                            <span className="text-[var(--dba-text-secondary)]">Correo:</span>
                            <span className="font-semibold">{regData.email}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[var(--dba-border)]">
                            <span className="text-[var(--dba-text-secondary)]">Ubicación:</span>
                            <span className="font-semibold">{regData.city}, RD</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-[var(--dba-text-secondary)]">Ruta:</span>
                            <span className="font-semibold uppercase text-[var(--dba-accent-ink)]">{regData.track}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-[var(--dba-text-secondary)] leading-relaxed">
                          Al registrarte confirmas tu interés en ingresar a la comunidad de aprendizaje de DB Academy y aceptas nuestras políticas de uso y tratamiento de datos.
                        </p>

                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setRegStep(2)}
                            className="w-1/3 rounded-xl border border-[var(--dba-border-strong)] py-3 text-xs font-semibold text-[var(--dba-text-secondary)] hover:bg-stone-200/50 dark:hover:bg-zinc-800"
                          >
                            Modificar
                          </button>
                          <button
                            type="submit"
                            className="w-2/3 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] py-3 text-sm font-bold text-[var(--dba-accent-foreground)] shadow-md active:scale-95"
                          >
                            <span>Confirmar y Enviar</span>
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </Container>
          </section>
        )}

        {/* LOGOS DE TECNOLOGÍAS DOMINADAS */}
        {config.showSectionTechnologies && (
          <section className="py-12 bg-[var(--dba-bg-surface)] border-b border-[var(--dba-border)]">
            <Container>
              <p className="text-center text-xs font-mono font-bold uppercase tracking-widest text-[var(--dba-text-secondary)] mb-6">
                {config.technologiesTitle}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm font-bold font-mono opacity-80">
                {config.technologiesList.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-1.5 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* PREGUNTAS FRECUENTES (FAQ ACCORDION) */}
        {config.showSectionFaq && (
          <section id="faq" className="py-16 sm:py-20 bg-[var(--dba-bg-canvas)] border-b border-[var(--dba-border)]">
            <Container>
              <div className="max-w-2xl mx-auto text-center space-y-3 mb-10">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--dba-accent-ink)] font-mono">
                  {config.faqBadge}
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--dba-text-primary)]">
                  {config.faqTitle}
                </h2>
                <p className="text-sm text-[var(--dba-text-secondary)]">
                  {config.faqSubtitle}
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-3">
                {config.faqList.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm font-bold text-[var(--dba-text-primary)] hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
                          activeFaq === idx ? 'rotate-180 text-[var(--dba-accent-ink)]' : ''
                        }`}
                      />
                    </button>
                    {activeFaq === idx && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-[var(--dba-text-secondary)] leading-relaxed border-t border-[var(--dba-border)] pt-3 animate-in fade-in">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Container>
          </section>
        )}
      </main>

      {/* FOOTER INSTITUCIONAL COMPLETO */}
      <footer className="bg-[var(--dba-bg-hero)] text-zinc-300 border-t border-zinc-800/90 pt-14 pb-10">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Columna 1: Marca & Misión */}
            <div className="space-y-4">
              <BrandLogo size="md" surface="dark" wordmarkClassName="text-white" christmasMode={isChristmas} />
              <p className="text-xs text-zinc-400 leading-relaxed">
                {config.footerDescription}
              </p>
              <div className="text-xs text-amber-300 font-mono">
                {config.footerLocation}
              </div>
            </div>

            {/* Columna 2: Enlaces Rápidos */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white font-display">Enlaces Rápidos</h3>
              <ul className="space-y-2 text-xs text-zinc-400">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Columna 3: Soporte Técnico & Contacto */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white font-display">Soporte Técnico</h3>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li className="flex items-start gap-2">
                  <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase">Soporte académico</p>
                    <a href={`mailto:${config.supportEmail}`} className="hover:text-white font-mono break-all">
                      {config.supportEmail}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase">Atención al estudiante</p>
                    <span className="font-mono">{config.contactPhone}</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase">Sede Central</p>
                    <span>{config.contactAddress}</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Columna 4: Conéctate & Legal */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white font-display">{config.footerCommunityTitle}</h3>
              <p className="text-xs text-zinc-400">
                {config.footerCommunityDesc}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => (user ? onOpenLearning() : void onSignIn())}
                  className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-3.5 py-2 text-xs font-semibold transition-all w-full justify-center"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>{user ? 'Ingresar al Campus' : 'Iniciar Sesión'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-800 text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>{config.footerCopyright}</p>
            <div className="flex flex-wrap items-center gap-4 text-zinc-400">
              <a
                href={legalDocumentPath('terminos')}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                {config.footerTermsLabel}
              </a>
              <span>·</span>
              <a
                href={legalDocumentPath('privacidad')}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                {config.footerPrivacyLabel}
              </a>
              <span>·</span>
              <a
                href={legalDocumentPath('cookies')}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Cookies
              </a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
};
