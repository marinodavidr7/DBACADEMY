import React from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  GraduationCap,
  LockKeyhole,
  MessageSquare,
  Moon,
  Radio,
  ShieldCheck,
  Sparkles,
  Sun,
  Wallet,
} from 'lucide-react';
import { LANDING_COPY } from '../data/landingCopy';
import { usePlatform } from '../context/PlatformContext';
import type { Course } from '../types';

interface LandingPageProps {
  onExplore: () => void;
  onSignIn: () => void | Promise<void>;
}

const FEATURE_ICONS = [Wallet, Radio, MessageSquare, Award, CalendarDays, LockKeyhole];

const formatPrice = (cents: number, currency: Course['currency']) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(cents / 100);

export const LandingPage: React.FC<LandingPageProps> = ({ onExplore, onSignIn }) => {
  const { courses, theme, toggleTheme } = usePlatform();
  const copy = LANDING_COPY;
  const featuredCourses = courses.filter((course) => course.published).slice(0, 3);

  const navLinks = [
    { href: '#beneficios', label: copy.nav.benefits },
    { href: '#como-funciona', label: copy.nav.how },
    { href: '#cursos', label: copy.nav.courses },
    { href: '#seguridad', label: copy.nav.security },
    { href: '#preguntas', label: copy.nav.faq },
  ];

  const levelLabel = (level: Course['level']) => copy.courses.level[level];

  return (
    <div id="top" className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-[#0F1624]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-2.5 shrink-0">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">DB Academy</span>
          </a>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="whitespace-nowrap transition-colors hover:text-blue-600 dark:hover:text-blue-400"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void toggleTheme()}
              aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => void onSignIn()}
              className="inline-flex min-h-[40px] items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
            >
              {copy.nav.signIn}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
          <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/30" />
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-900 bg-white/70 dark:bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                <Sparkles className="h-3.5 w-3.5" />
                {copy.hero.badge}
              </span>
              <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                {copy.hero.title}
                <br />
                <span className="text-blue-600 dark:text-blue-400">{copy.hero.titleAccent}</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                {copy.hero.subtitle}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void onSignIn()}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {copy.hero.primary}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onExplore}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <BookOpen className="h-4 w-4" />
                  {copy.hero.secondary}
                </button>
              </div>
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{copy.hero.note}</p>
            </div>

            {/* Representación de la interfaz real de la plataforma */}
            <div aria-hidden="true" className="relative mx-auto w-full max-w-lg">
              <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-blue-500/10 blur-3xl" />
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl shadow-slate-900/10">
                <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-3 font-mono text-[11px] text-slate-400">db-academy · panel</span>
                </div>
                <div className="grid grid-cols-[52px_1fr]">
                  <div className="flex flex-col items-center gap-3 border-r border-slate-200 dark:border-slate-800 py-4">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white">
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400">
                      <MessageSquare className="h-4 w-4" />
                    </span>
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400">
                      <Award className="h-4 w-4" />
                    </span>
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400">
                      <CalendarDays className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="p-4 sm:p-6">
                    <p className="font-display text-lg font-semibold">{copy.hero.mockTitle}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {copy.hero.mockSubtitle}
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        String(courses.length),
                        'ES / EN / FR / PT',
                        'PDF',
                      ].map((value, index) => (
                        <div
                          key={value}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2.5"
                        >
                          <p className="font-mono text-sm font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                            {value}
                          </p>
                          <p className="mt-0.5 text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                            {copy.hero.mockStats[index]}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-medium leading-snug">{copy.hero.mockCourse}</p>
                        <span className="shrink-0 rounded-full bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                          En curso
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full w-2/3 rounded-full bg-blue-600" />
                      </div>
                      <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                        {copy.hero.mockProgress}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-2 flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] px-3 py-2 text-xs font-medium shadow-lg sm:-left-8">
                <Radio className="h-3.5 w-3.5 text-emerald-500" />
                Sincronizado
              </div>
            </div>
          </div>
        </section>

        {/* Datos verificables del producto */}
        <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
            {copy.stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Problema y beneficios */}
        <section id="beneficios" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {copy.problem.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {copy.problem.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                {copy.problem.subtitle}
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {copy.problem.items.map((item, index) => {
                const Icon = index === 0 ? Wallet : Radio;
                return (
                  <article
                    key={item.title}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {item.body}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="mt-16">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {copy.features.eyebrow}
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  {copy.features.title}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  {copy.features.subtitle}
                </p>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {copy.features.items.map((feature, index) => {
                  const Icon = FEATURE_ICONS[index];
                  return (
                    <article
                      key={feature.title}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6"
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-4 font-display text-base font-semibold">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {feature.body}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section
          id="como-funciona"
          className="scroll-mt-20 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] py-16 sm:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {copy.how.eyebrow}
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {copy.how.title}
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {copy.how.steps.map((step, index) => (
                <div key={step.title} className="relative">
                  <span className="font-display text-5xl font-bold text-blue-100 dark:text-blue-950">
                    0{index + 1}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cursos reales del catálogo */}
        <section id="cursos" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {copy.courses.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {copy.courses.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                {copy.courses.subtitle}
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredCourses.map((course) => (
                <article
                  key={course.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]"
                >
                  <img
                    src={course.coverImage}
                    alt=""
                    loading="lazy"
                    className="h-40 w-full object-cover"
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
                      <span className="rounded-full bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 text-blue-700 dark:text-blue-300">
                        {course.category}
                      </span>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-slate-600 dark:text-slate-300">
                        {levelLabel(course.level)}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-base font-semibold leading-snug">
                      {course.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                      {course.subtitle}
                    </p>
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      {course.modulesCount} {copy.courses.modules} · {course.totalLessons}{' '}
                      {copy.courses.lessons}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                      <span className="font-mono text-sm font-semibold tabular-nums">
                        {formatPrice(course.priceCents, course.currency)}
                      </span>
                      <button
                        type="button"
                        onClick={onExplore}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        {copy.courses.action}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Profesores y seguridad */}
        <section
          id="seguridad"
          className="scroll-mt-20 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] py-16 sm:py-20"
        >
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-start lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {copy.instructors.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
                {copy.instructors.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                {copy.instructors.body}
              </p>
              <ul className="mt-6 space-y-3">
                {copy.instructors.points.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm text-slate-700 dark:text-slate-200">
                    <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={onExplore}
                className="mt-7 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {copy.instructors.action}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] p-6 sm:p-8">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600 text-white">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {copy.security.eyebrow}
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
                {copy.security.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {copy.security.body}
              </p>
              <ul className="mt-6 space-y-3">
                {copy.security.points.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm text-slate-700 dark:text-slate-200">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="preguntas" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {copy.faq.eyebrow}
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {copy.faq.title}
            </h2>
            <div className="mt-8 divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-5">
              {copy.faq.items.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="flex min-h-[24px] cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Cierre */}
        <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-slate-900 px-6 py-12 text-center sm:px-12 sm:py-16 dark:bg-[#141d2e]">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {copy.final.title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              {copy.final.subtitle}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void onSignIn()}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-500"
              >
                {copy.final.primary}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onExplore}
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-slate-600 px-6 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {copy.final.secondary}
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white">
                <GraduationCap className="h-4 w-4" />
              </span>
              <span className="font-display text-base font-bold">DB Academy</span>
            </div>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {copy.footer.tagline} {copy.footer.note}
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-blue-600 dark:hover:text-blue-400">
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
};
