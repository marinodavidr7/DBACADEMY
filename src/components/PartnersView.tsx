import React, { useEffect } from 'react';
import { Award, Building2, CheckCircle2, CreditCard, Globe, MessageSquare, ShieldCheck, Users } from 'lucide-react';
import { trackEvent } from '../utils/analytics';

const BENEFITS = [
  {
    icon: Globe,
    title: 'Tu academia, lista para operar',
    body: 'Publica cursos, organiza módulos y lecciones, y gestiona estudiantes desde una sola plataforma.',
  },
  {
    icon: CreditCard,
    title: 'Cobros integrados con PayPal',
    body: 'Vende cursos y gift cards con un flujo de pago integrado y confirmación del pago antes de desbloquear acceso.',
  },
  {
    icon: Award,
    title: 'Certificados verificables',
    body: 'Emite certificados con código, QR y página pública de verificación para respaldar la formación.',
  },
  {
    icon: MessageSquare,
    title: 'Aprendizaje con seguimiento',
    body: 'Progreso en tiempo real, foros por curso y herramientas para acompañar a los estudiantes.',
  },
  {
    icon: ShieldCheck,
    title: 'Confianza y privacidad',
    body: 'Documentos legales, controles de acceso y notas cifradas de extremo a extremo para la experiencia del estudiante.',
  },
  {
    icon: Users,
    title: 'Para instructores y academias',
    body: 'Ideal para formadores independientes, academias pequeñas y programas técnicos que quieren vender y operar sin armar varias herramientas.',
  },
];

const STEPS = [
  { title: 'Conversamos tu programa', body: 'Entendemos tus cursos, audiencia, precios y forma de operación.' },
  { title: 'Configuramos tu espacio', body: 'Preparamos catálogo, estructura de cursos, pagos y flujo de certificados.' },
  { title: 'Publicas y vendes', body: 'Lanzas tus cursos con acceso, seguimiento y verificación listos para tus estudiantes.' },
];

export const PartnersView: React.FC = () => {
  const contactEmail = 'info@dbacademy.io';
  const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent('Quiero información para instructores/academias — DB Academy')}&body=${encodeURIComponent(
    'Hola equipo DB Academy,\n\nMe interesa usar DB Academy para instructores/academias.\n\nNombre:\nAcademia/Proyecto:\nTipo de cursos:\nCantidad estimada de estudiantes:\nPaís:\n\nGracias.'
  )}`;

  useEffect(() => {
    document.title = 'Para instructores y academias — DB Academy';
    trackEvent('partners_view', { source: window.location.pathname });
  }, []);

  const onContact = () => {
    trackEvent('partners_cta_click', { method: 'mailto', location: 'partners_view' });
    window.location.href = mailto;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10 pb-8">
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-blue-50/60 dark:from-[#0B1220] dark:via-[#0B1220] dark:to-blue-950/20 p-6 sm:p-8 lg:p-10">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
            <Building2 className="w-3.5 h-3.5" /> Para instructores y academias
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Enseña y vende tus cursos con una plataforma lista para operar.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
            DB Academy reúne pagos, contenido, progreso, foros y certificados verificables en un solo lugar. Diseñado para instructores independientes y academias técnicas que quieren enfocarse en enseñar, no en armar herramientas.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={onContact}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 min-h-[44px]"
            >
              Solicitar información
            </button>
            <a
              href={mailto}
              onClick={() => trackEvent('partners_cta_click', { method: 'mailto_link', location: 'partners_hero' })}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/40 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]"
            >
              Contactar por correo
            </a>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Respuesta por correo a {contactEmail}. Adaptamos la propuesta según tu programa y volumen.</p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-blue-600 dark:text-blue-400">Qué incluye</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">Todo lo necesario para operar tu formación</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-5">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-blue-600 dark:text-blue-400">Cómo funciona</p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">Un proceso simple para empezar</h2>
          </div>
          <div className="space-y-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{step.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/20 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Ideal si quieres</h3>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            {[
              'Vender cursos técnicos con pagos por PayPal',
              'Entregar certificados verificables con QR',
              'Evitar usar varias herramientas separadas',
              'Tener control sobre estudiantes y progreso',
              'Lanzar una academia o programa de formación',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onContact}
            className="w-full inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 min-h-[44px]"
          >
            Hablar con DB Academy
          </button>
        </div>
      </section>
    </div>
  );
};
