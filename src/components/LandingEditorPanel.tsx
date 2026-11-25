import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode,
  Globe,
  HelpCircle,
  Layers,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  TrendingUp,
  Upload,
  Video,
} from 'lucide-react';
import {
  DEFAULT_LANDING_CONFIG,
  getLandingConfig,
  saveLandingConfig,
  resetLandingConfig,
  type LandingConfig,
  type LandingEventItem,
  type LandingFaqItem,
} from '../services/landingConfigService';

interface LandingEditorPanelProps {
  onPreviewLanding?: () => void;
}

export const LandingEditorPanel: React.FC<LandingEditorPanelProps> = ({ onPreviewLanding }) => {
  const [config, setConfig] = useState<LandingConfig>(() => getLandingConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | 'visibility'
    | 'christmas'
    | 'header'
    | 'hero'
    | 'stats'
    | 'about'
    | 'tracks'
    | 'courses'
    | 'events'
    | 'register'
    | 'technologies'
    | 'faq'
    | 'footer'
  >('visibility');

  useEffect(() => {
    setConfig(getLandingConfig());
  }, []);

  const handleSave = () => {
    saveLandingConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleReset = () => {
    if (
      window.confirm(
        '¿Estás seguro de que deseas restablecer TODOS los textos y visibilidad de secciones del landing a los valores oficiales de DB Academy?'
      )
    ) {
      const reset = resetLandingConfig();
      setConfig(reset);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    }
  };

  // Event handlers for dynamic arrays
  const handleAddEvent = () => {
    const newEvent: LandingEventItem = {
      id: `ev-${Date.now()}`,
      title: 'Nuevo Taller Práctico en Vivo',
      date: 'Próximamente',
      speaker: 'Equipo Docente DB Academy',
      mode: 'En vivo / Interactivo',
      badge: 'Acceso Libre',
      buttonText: 'Reservar cupo gratis',
    };
    setConfig((prev) => ({ ...prev, events: [...prev.events, newEvent] }));
  };

  const handleRemoveEvent = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      events: prev.events.filter((_, i) => i !== index),
    }));
  };

  const handleAddFaq = () => {
    const newFaq: LandingFaqItem = {
      q: '¿Nueva pregunta frecuente?',
      a: 'Escribe aquí la respuesta detallada para tus estudiantes.',
    };
    setConfig((prev) => ({ ...prev, faqList: [...prev.faqList, newFaq] }));
  };

  const handleRemoveFaq = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      faqList: prev.faqList.filter((_, i) => i !== index),
    }));
  };

  const tabs = [
    { id: 'visibility', label: '👁️ Activar / Desactivar Secciones', icon: Eye },
    { id: 'christmas', label: '🎄 Navidad & Banners', icon: Sparkles },
    { id: 'header', label: '🧭 Header & Menú', icon: Globe },
    { id: 'hero', label: '🚀 Hero & Titular', icon: Layers },
    { id: 'stats', label: '📊 Métricas de Impacto', icon: TrendingUp },
    { id: 'about', label: '📖 Acerca de & Metodología', icon: BookOpen },
    { id: 'tracks', label: '🎯 Rutas de Aprendizaje', icon: Layers },
    { id: 'courses', label: '🎓 Catálogo de Cursos', icon: Award },
    { id: 'events', label: '📅 Eventos en Vivo', icon: Calendar },
    { id: 'register', label: '📝 Formulario de Registro', icon: CheckCircle2 },
    { id: 'technologies', label: '🛠️ Tecnologías Dominadas', icon: FileCode },
    { id: 'faq', label: '❓ Preguntas Frecuentes', icon: HelpCircle },
    { id: 'footer', label: '🏢 Footer, Contacto & Legal', icon: Phone },
  ] as const;

  const sectionToggles = [
    {
      key: 'showSectionBanner' as const,
      label: 'Cintillo Superior de Anuncios',
      desc: 'Barra horizontal superior para comunicar avisos urgentes o promociones.',
      tab: 'christmas' as const,
    },
    {
      key: 'showSectionStats' as const,
      label: 'Métricas de Impacto (+3,500 Estudiantes)',
      desc: 'Las 4 tarjetas de cifras con contadores numéricos estilo Talento Digital.',
      tab: 'stats' as const,
    },
    {
      key: 'showSectionAbout' as const,
      label: 'Sección "Acerca de DB Academy" & Metodología',
      desc: 'Bloque editorial que explica el modelo de formación y los 4 pilares.',
      tab: 'about' as const,
    },
    {
      key: 'showSectionTracks' as const,
      label: 'Rutas de Aprendizaje (Tech vs Emprendimiento)',
      desc: 'Las dos grandes tarjetas de trayectos formativos principales.',
      tab: 'tracks' as const,
    },
    {
      key: 'showSectionCourses' as const,
      label: 'Catálogo de Cursos y Certificaciones',
      desc: 'Grilla interactiva con los cursos publicados en la academia.',
      tab: 'courses' as const,
    },
    {
      key: 'showSectionEvents' as const,
      label: 'Próximos Eventos & Masterclasses ("Aprende, conecta y crece")',
      desc: 'Tarjetas con fechas, ponentes y modalidades de talleres en vivo.',
      tab: 'events' as const,
    },
    {
      key: 'showSectionRegister' as const,
      label: 'Formulario de Admisión por Pasos ("¡Regístrate!")',
      desc: 'Flujo en pasos para recolección de prospectos y acceso directo.',
      tab: 'register' as const,
    },
    {
      key: 'showSectionTechnologies' as const,
      label: 'Franja de Tecnologías Dominadas (Excel, Python, Cloud...)',
      desc: 'Insignias y badges de herramientas del mercado laboral.',
      tab: 'technologies' as const,
    },
    {
      key: 'showSectionFaq' as const,
      label: 'Preguntas Frecuentes (FAQ Accordion)',
      desc: 'Respuestas a dudas comunes sobre pagos, certificados y metodología.',
      tab: 'faq' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-[var(--dba-accent)]/20 text-[var(--dba-accent-ink)]">
                <Globe className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--dba-text-primary)]">
                  Módulo de Edición Total del Landing
                </h1>
                <p className="text-xs sm:text-sm text-[var(--dba-text-secondary)] mt-0.5">
                  Controla y edita <strong>absolutamente toda la información</strong> visible en el landing: activa/desactiva secciones completas, cambia titulares, métricas, rutas, cursos, eventos, formulario, preguntas frecuentes y modo festivo.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onPreviewLanding && (
              <button
                type="button"
                onClick={onPreviewLanding}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--dba-border-strong)] bg-[var(--dba-bg-canvas)] px-3.5 py-2 text-xs font-semibold text-[var(--dba-text-primary)] hover:bg-stone-200/50 dark:hover:bg-zinc-800 transition-colors min-h-[40px]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver Landing en Vivo</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 min-h-[40px]"
              title="Restablecer a valores iniciales de fábrica"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Valores por defecto</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-5 py-2 text-xs font-bold text-[var(--dba-accent-foreground)] shadow-md transition-all min-h-[40px] active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>¡Toda la configuración del landing ha sido guardada y publicada en vivo exitosamente!</span>
          </div>
        )}
      </div>

      {/* Main Tab Bar */}
      <div className="flex items-center gap-1.5 border-b border-[var(--dba-border)] overflow-x-auto pb-1 bg-[var(--dba-bg-surface)] p-2 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)] shadow-xs'
                  : 'text-[var(--dba-text-secondary)] hover:text-[var(--dba-text-primary)] hover:bg-stone-200/50 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 0. PANEL MAESTRO DE ACTIVAR / DESACTIVAR SECCIONES */}
      {activeTab === 'visibility' && (
        <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[var(--dba-accent)]/20 text-[var(--dba-accent-ink)]">
                <Eye className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-[var(--dba-text-primary)]">
                Interruptores de Visibilidad de Secciones
              </h2>
            </div>
            <p className="text-xs text-[var(--dba-text-secondary)] mt-1">
              Enciende o apaga cualquier sección del landing page con un solo clic. Cuando desactivas una sección, esta desaparece automáticamente del landing y su enlace se remueve del menú de navegación para evitar enlaces rotos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {sectionToggles.map((sec) => {
              const isVisible = config[sec.key];
              return (
                <div
                  key={sec.key}
                  className={`rounded-xl border p-4.5 flex flex-col justify-between space-y-4 transition-all ${
                    isVisible
                      ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 opacity-75'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          isVisible
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {isVisible ? '🟢 Visible en la Web' : '⚪ Oculta'}
                      </span>

                      <button
                        type="button"
                        onClick={() => setActiveTab(sec.tab)}
                        className="text-[11px] font-semibold text-[var(--dba-accent-ink)] hover:underline flex items-center gap-0.5"
                      >
                        <span>Editar contenido</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <h3 className="font-bold text-sm text-[var(--dba-text-primary)]">
                      {sec.label}
                    </h3>
                    <p className="text-xs text-[var(--dba-text-secondary)] leading-relaxed">
                      {sec.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[var(--dba-border)]/60 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--dba-text-secondary)]">
                      Estado:
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, [sec.key]: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      <span className="ml-2.5 text-xs font-bold text-[var(--dba-text-primary)]">
                        {isVisible ? 'Activa' : 'Desactivada'}
                      </span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. SECCIÓN NAVIDAD & BANNERS */}
      {activeTab === 'christmas' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-red-300 dark:border-red-900 bg-gradient-to-br from-red-50/70 via-amber-50/30 to-emerald-50/40 dark:from-red-950/30 dark:via-zinc-900 dark:to-emerald-950/20 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-200 dark:border-red-900/60 pb-4">
              <div>
                <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider font-mono">
                  🎄 Temporada Festiva
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Modo Navidad (Global Festive Switch)
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Diciembre se activa automáticamente. Este interruptor permite forzar el modo navideño en otros meses (nieve, logo y cinta festiva).
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.christmasMode}
                  onChange={(e) => setConfig((prev) => ({ ...prev, christmasMode: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-300 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                <span className="ml-3 text-xs font-bold text-slate-900 dark:text-slate-100">
                  {config.christmasMode ? 'Forzar Navidad ON' : 'Navidad OFF (auto en dic.)'}
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Saludo y Mensaje Festivo de Navidad
              </label>
              <input
                type="text"
                value={config.christmasGreeting}
                onChange={(e) => setConfig((prev) => ({ ...prev, christmasGreeting: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] px-3.5 py-2.5 text-xs text-[var(--dba-text-primary)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-red-200/60 dark:border-red-900/40 bg-white/60 dark:bg-zinc-900/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showSnow}
                  onChange={(e) => setConfig((prev) => ({ ...prev, showSnow: e.target.checked }))}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Mostrar copos de nieve animados (Canvas Snow)
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-red-200/60 dark:border-red-900/40 bg-white/60 dark:bg-zinc-900/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showSantaHat}
                  onChange={(e) => setConfig((prev) => ({ ...prev, showSantaHat: e.target.checked }))}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Mostrar gorrito de Papá Noel en el logo de DB Academy
                </span>
              </label>
            </div>
          </div>

          {/* Banner de Anuncio Normal */}
          <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--dba-border)] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--dba-text-primary)]">
                  Cintillo / Banner de Anuncios General (Cuando no es Navidad)
                </h2>
                <p className="text-xs text-[var(--dba-text-secondary)]">
                  Texto promocional o aviso de inscripciones en la parte superior del sitio.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showSectionBanner}
                    onChange={(e) => setConfig((prev) => ({ ...prev, showSectionBanner: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2 text-xs font-bold">
                    {config.showSectionBanner ? 'Visible' : 'Oculto'}
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[var(--dba-text-secondary)] mb-1">
                  Texto del Anuncio
                </label>
                <input
                  type="text"
                  value={config.bannerText}
                  onChange={(e) => setConfig((prev) => ({ ...prev, bannerText: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--dba-text-secondary)] mb-1">
                  Texto del Enlace
                </label>
                <input
                  type="text"
                  value={config.bannerLinkText}
                  onChange={(e) => setConfig((prev) => ({ ...prev, bannerLinkText: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. HEADER & NAVEGACIÓN */}
      {activeTab === 'header' && (
        <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-6 space-y-4">
          <h2 className="text-sm font-bold text-[var(--dba-text-primary)] border-b border-[var(--dba-border)] pb-2">
            Etiquetas del Menú de Navegación y Botones del Header
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--dba-text-secondary)] mb-1">
                Enlace 1 (Inicio)
              </label>
              <input
                type="text"
                value={config.navHomeLabel}
                onChange={(e) => setConfig((prev) => ({ ...prev, navHomeLabel: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--dba-text-secondary)] mb-1">
                Enlace 2 (Acerca de)
              </label>
              <input
                type="text"
                value={config.navAboutLabel}
                onChange={(e) => setConfig((prev) => ({ ...prev, navAboutLabel: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--dba-text-secondary)] mb-1">
                Enlace 3 (Rutas)
              </label>
              <input
                type="text"
                value={config.navTracksLabel}
                onChange={(e) => setConfig((prev) => ({ ...prev, navTracksLabel: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--dba-text-secondary)] mb-1">
                Enlace 4 (Cursos)
              </label>
              <input
                type="text"
                value={config.navCoursesLabel}
                onChange={(e) => setConfig((prev) => ({ ...prev, navCoursesLabel: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--dba-text-secondary)] mb-1">
                Enlace 5 (Eventos)
              </label>
              <input
                type="text"
                value={config.navEventsLabel}
                onChange={(e) => setConfig((prev) => ({ ...prev, navEventsLabel: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--dba-text-secondary)] mb-1">
                Enlace 6 (Registro)
              </label>
              <input
                type="text"
                value={config.navRegisterLabel}
                onChange={(e) => setConfig((prev) => ({ ...prev, navRegisterLabel: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--dba-text-secondary)] mb-1">
                Enlace 7 (Preguntas)
              </label>
              <input
                type="text"
                value={config.navFaqLabel}
                onChange={(e) => setConfig((prev) => ({ ...prev, navFaqLabel: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--dba-text-secondary)] mb-1">
                Botón Header (Visitantes)
              </label>
              <input
                type="text"
                value={config.navCtaExploreText}
                onChange={(e) => setConfig((prev) => ({ ...prev, navCtaExploreText: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. HERO & TITULAR */}
      {activeTab === 'hero' && (
        <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-6 space-y-5">
          <h2 className="text-sm font-bold text-[var(--dba-text-primary)] border-b border-[var(--dba-border)] pb-2">
            Sección Principal del Hero (Estilo Talento Digital)
          </h2>

          <div>
            <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1.5">
              Insignia Superior (Hero Badge)
            </label>
            <input
              type="text"
              value={config.heroBadge}
              onChange={(e) => setConfig((prev) => ({ ...prev, heroBadge: e.target.value }))}
              className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3.5 py-2 text-xs text-[var(--dba-text-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1.5">
              Titular Principal H1 (Talento Digital Style)
            </label>
            <input
              type="text"
              value={config.heroTitle}
              onChange={(e) => setConfig((prev) => ({ ...prev, heroTitle: e.target.value }))}
              className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3.5 py-2.5 text-base font-extrabold text-[var(--dba-text-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1.5">
              Subtítulo Descriptivo
            </label>
            <textarea
              rows={3}
              value={config.heroSubtitle}
              onChange={(e) => setConfig((prev) => ({ ...prev, heroSubtitle: e.target.value }))}
              className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3.5 py-2.5 text-xs text-[var(--dba-text-primary)] leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--dba-text-secondary)] mb-1">
                Texto Botón Principal (CTA 1)
              </label>
              <input
                type="text"
                value={config.heroCtaPrimary}
                onChange={(e) => setConfig((prev) => ({ ...prev, heroCtaPrimary: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--dba-text-secondary)] mb-1">
                Texto Botón Secundario (CTA 2)
              </label>
              <input
                type="text"
                value={config.heroCtaSecondary}
                onChange={(e) => setConfig((prev) => ({ ...prev, heroCtaSecondary: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
          </div>

          {/* Chips de confianza */}
          <div className="pt-2 border-t border-[var(--dba-border)] space-y-3">
            <label className="block text-xs font-bold text-[var(--dba-text-secondary)]">
              Sellos de Confianza (Chips del Hero)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {config.heroTrustChips.map((chip, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={chip}
                  onChange={(e) => {
                    const next = [...config.heroTrustChips];
                    next[idx] = e.target.value;
                    setConfig((prev) => ({ ...prev, heroTrustChips: next }));
                  }}
                  className="rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
                />
              ))}
            </div>
          </div>

          {/* Campus Showcase */}
          <div className="pt-2 border-t border-[var(--dba-border)] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--dba-text-secondary)] mb-1">
                Insignia del Campus Virtual
              </label>
              <input
                type="text"
                value={config.campusBadge}
                onChange={(e) => setConfig((prev) => ({ ...prev, campusBadge: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--dba-text-secondary)] mb-1">
                Subtítulo de la Tarjeta del Campus
              </label>
              <input
                type="text"
                value={config.campusSubtext}
                onChange={(e) => setConfig((prev) => ({ ...prev, campusSubtext: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. MÉTRICAS DE IMPACTO */}
      {activeTab === 'stats' && (
        <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--dba-border)] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--dba-text-primary)]">
                Las 4 Cifras y Métricas de Impacto (Contadores Estilo Talento Digital)
              </h2>
              <p className="text-xs text-[var(--dba-text-secondary)]">
                Controla los números y si esta franja debe mostrarse u ocultarse.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.showSectionStats}
                onChange={(e) => setConfig((prev) => ({ ...prev, showSectionStats: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2 text-xs font-bold">
                {config.showSectionStats ? 'Visible' : 'Oculta'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.stats.map((stat, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-4 space-y-3"
              >
                <span className="text-xs font-mono font-bold text-[var(--dba-accent-ink)]">
                  Métrica #{idx + 1}
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--dba-text-secondary)] mb-1">
                      Cifra
                    </label>
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => {
                        const next = [...config.stats] as typeof config.stats;
                        next[idx] = { ...next[idx], value: e.target.value };
                        setConfig((prev) => ({ ...prev, stats: next }));
                      }}
                      className="w-full rounded-lg border border-[var(--dba-border)] px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-[var(--dba-text-secondary)] mb-1">
                      Concepto / Etiqueta
                    </label>
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => {
                        const next = [...config.stats] as typeof config.stats;
                        next[idx] = { ...next[idx], label: e.target.value };
                        setConfig((prev) => ({ ...prev, stats: next }));
                      }}
                      className="w-full rounded-lg border border-[var(--dba-border)] px-3 py-2 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. ACERCA DE & METODOLOGÍA */}
      {activeTab === 'about' && (
        <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--dba-border)] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--dba-text-primary)]">
                Sección "Acerca de DB Academy" y los 4 Pilares de Metodología
              </h2>
              <p className="text-xs text-[var(--dba-text-secondary)]">
                Gestiona el contenido institucional y su visibilidad en el landing.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.showSectionAbout}
                onChange={(e) => setConfig((prev) => ({ ...prev, showSectionAbout: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2 text-xs font-bold">
                {config.showSectionAbout ? 'Visible' : 'Oculta'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Insignia de Sección
              </label>
              <input
                type="text"
                value={config.aboutBadge}
                onChange={(e) => setConfig((prev) => ({ ...prev, aboutBadge: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Título Principal
              </label>
              <input
                type="text"
                value={config.aboutTitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, aboutTitle: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
              Descripción General
            </label>
            <textarea
              rows={2}
              value={config.aboutDescription}
              onChange={(e) => setConfig((prev) => ({ ...prev, aboutDescription: e.target.value }))}
              className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
              Texto Destacado (Caja de Metodología)
            </label>
            <textarea
              rows={2}
              value={config.aboutHighlightText}
              onChange={(e) => setConfig((prev) => ({ ...prev, aboutHighlightText: e.target.value }))}
              className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
            />
          </div>

          <div className="pt-2 border-t border-[var(--dba-border)] space-y-4">
            <h3 className="text-xs font-bold text-[var(--dba-text-secondary)] uppercase tracking-wider font-mono">
              Los 4 Pilares de la Metodología
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {config.aboutPillars.map((p, idx) => (
                <div key={idx} className="rounded-lg border border-[var(--dba-border)] p-3.5 bg-[var(--dba-bg-canvas)] space-y-2">
                  <span className="text-[11px] font-bold text-[var(--dba-accent-ink)] font-mono">
                    Pilar #{idx + 1}
                  </span>
                  <div>
                    <input
                      type="text"
                      value={p.title}
                      onChange={(e) => {
                        const next = [...config.aboutPillars] as typeof config.aboutPillars;
                        next[idx] = { ...next[idx], title: e.target.value };
                        setConfig((prev) => ({ ...prev, aboutPillars: next }));
                      }}
                      className="w-full rounded-md border border-[var(--dba-border)] px-2.5 py-1.5 text-xs font-bold mb-1"
                    />
                    <textarea
                      rows={2}
                      value={p.desc}
                      onChange={(e) => {
                        const next = [...config.aboutPillars] as typeof config.aboutPillars;
                        next[idx] = { ...next[idx], desc: e.target.value };
                        setConfig((prev) => ({ ...prev, aboutPillars: next }));
                      }}
                      className="w-full rounded-md border border-[var(--dba-border)] px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. RUTAS DE APRENDIZAJE */}
      {activeTab === 'tracks' && (
        <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--dba-border)] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--dba-text-primary)]">
                Las 2 Grandes Rutas de Aprendizaje (Career Tracks)
              </h2>
              <p className="text-xs text-[var(--dba-text-secondary)]">
                Controla los textos de las rutas formativas y su visibilidad en el sitio.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.showSectionTracks}
                onChange={(e) => setConfig((prev) => ({ ...prev, showSectionTracks: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2 text-xs font-bold">
                {config.showSectionTracks ? 'Visible' : 'Oculta'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Insignia de Sección
              </label>
              <input
                type="text"
                value={config.tracksBadge}
                onChange={(e) => setConfig((prev) => ({ ...prev, tracksBadge: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Título de la Sección
              </label>
              <input
                type="text"
                value={config.tracksTitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, tracksTitle: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Subtítulo de la Sección
              </label>
              <input
                type="text"
                value={config.tracksSubtitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, tracksSubtitle: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {config.tracks.map((track, idx) => (
              <div
                key={track.id}
                className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[var(--dba-accent-ink)]">
                    Ruta #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={track.badge}
                    onChange={(e) => {
                      const next = [...config.tracks] as typeof config.tracks;
                      next[idx] = { ...next[idx], badge: e.target.value };
                      setConfig((prev) => ({ ...prev, tracks: next }));
                    }}
                    className="text-right text-xs font-bold text-[var(--dba-accent-ink)] bg-transparent border-b border-dashed border-slate-300 dark:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                    Pregunta / Título
                  </label>
                  <input
                    type="text"
                    value={track.title}
                    onChange={(e) => {
                      const next = [...config.tracks] as typeof config.tracks;
                      next[idx] = { ...next[idx], title: e.target.value };
                      setConfig((prev) => ({ ...prev, tracks: next }));
                    }}
                    className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    value={track.description}
                    onChange={(e) => {
                      const next = [...config.tracks] as typeof config.tracks;
                      next[idx] = { ...next[idx], description: e.target.value };
                      setConfig((prev) => ({ ...prev, tracks: next }));
                    }}
                    className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] px-3 py-2 text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                    Texto del Botón
                  </label>
                  <input
                    type="text"
                    value={track.buttonText}
                    onChange={(e) => {
                      const next = [...config.tracks] as typeof config.tracks;
                      next[idx] = { ...next[idx], buttonText: e.target.value };
                      setConfig((prev) => ({ ...prev, tracks: next }));
                    }}
                    className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                    Etiquetas / Tags (Separadas por comas)
                  </label>
                  <input
                    type="text"
                    value={track.tags.join(', ')}
                    onChange={(e) => {
                      const next = [...config.tracks] as typeof config.tracks;
                      next[idx] = {
                        ...next[idx],
                        tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      };
                      setConfig((prev) => ({ ...prev, tracks: next }));
                    }}
                    className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] px-3 py-2 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. CATÁLOGO DE CURSOS */}
      {activeTab === 'courses' && (
        <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--dba-border)] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--dba-text-primary)]">
                Cabecera de la Sección de Cursos y Certificaciones
              </h2>
              <p className="text-xs text-[var(--dba-text-secondary)]">
                Muestra u oculta la sección completa de cursos en el landing.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.showSectionCourses}
                onChange={(e) => setConfig((prev) => ({ ...prev, showSectionCourses: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2 text-xs font-bold">
                {config.showSectionCourses ? 'Visible' : 'Oculta'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Insignia de la Sección
              </label>
              <input
                type="text"
                value={config.coursesBadge}
                onChange={(e) => setConfig((prev) => ({ ...prev, coursesBadge: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Título de la Sección
              </label>
              <input
                type="text"
                value={config.coursesTitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, coursesTitle: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
              Subtítulo de la Sección
            </label>
            <input
              type="text"
              value={config.coursesSubtitle}
              onChange={(e) => setConfig((prev) => ({ ...prev, coursesSubtitle: e.target.value }))}
              className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
              Texto del Enlace al Catálogo Completo
            </label>
            <input
              type="text"
              value={config.coursesCatalogLinkText}
              onChange={(e) => setConfig((prev) => ({ ...prev, coursesCatalogLinkText: e.target.value }))}
              className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
            />
          </div>
        </div>
      )}

      {/* 8. EVENTOS Y MASTERCLASSES */}
      {activeTab === 'events' && (
        <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--dba-border)] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--dba-text-primary)]">
                Encuentros y Masterclasses ("Aprende, conecta y crece")
              </h2>
              <p className="text-xs text-[var(--dba-text-secondary)]">
                Agrega, edita o elimina los talleres en vivo que generan tracción y comunidad.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showSectionEvents}
                  onChange={(e) => setConfig((prev) => ({ ...prev, showSectionEvents: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-xs font-bold">
                  {config.showSectionEvents ? 'Visible' : 'Oculta'}
                </span>
              </label>

              <button
                type="button"
                onClick={handleAddEvent}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)] px-3 py-1.5 text-xs font-bold hover:bg-[var(--dba-accent-hover)] transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Evento</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Insignia
              </label>
              <input
                type="text"
                value={config.eventsBadge}
                onChange={(e) => setConfig((prev) => ({ ...prev, eventsBadge: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Título
              </label>
              <input
                type="text"
                value={config.eventsTitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, eventsTitle: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Subtítulo
              </label>
              <input
                type="text"
                value={config.eventsSubtitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, eventsSubtitle: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {config.events.map((ev, idx) => (
              <div
                key={ev.id}
                className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-4 space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[var(--dba-accent-ink)]">
                    Evento #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEvent(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Eliminar evento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--dba-text-secondary)] mb-1">
                      Título del Evento
                    </label>
                    <input
                      type="text"
                      value={ev.title}
                      onChange={(e) => {
                        const next = [...config.events];
                        next[idx] = { ...next[idx], title: e.target.value };
                        setConfig((prev) => ({ ...prev, events: next }));
                      }}
                      className="w-full rounded-md border border-[var(--dba-border)] px-3 py-1.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--dba-text-secondary)] mb-1">
                      Fecha / Horario
                    </label>
                    <input
                      type="text"
                      value={ev.date}
                      onChange={(e) => {
                        const next = [...config.events];
                        next[idx] = { ...next[idx], date: e.target.value };
                        setConfig((prev) => ({ ...prev, events: next }));
                      }}
                      className="w-full rounded-md border border-[var(--dba-border)] px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--dba-text-secondary)] mb-1">
                      Ponente / Especialista
                    </label>
                    <input
                      type="text"
                      value={ev.speaker}
                      onChange={(e) => {
                        const next = [...config.events];
                        next[idx] = { ...next[idx], speaker: e.target.value };
                        setConfig((prev) => ({ ...prev, events: next }));
                      }}
                      className="w-full rounded-md border border-[var(--dba-border)] px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--dba-text-secondary)] mb-1">
                      Modalidad (ej. En vivo / Interactivo)
                    </label>
                    <input
                      type="text"
                      value={ev.mode}
                      onChange={(e) => {
                        const next = [...config.events];
                        next[idx] = { ...next[idx], mode: e.target.value };
                        setConfig((prev) => ({ ...prev, events: next }));
                      }}
                      className="w-full rounded-md border border-[var(--dba-border)] px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--dba-text-secondary)] mb-1">
                      Insignia (ej. Cupos limitados)
                    </label>
                    <input
                      type="text"
                      value={ev.badge}
                      onChange={(e) => {
                        const next = [...config.events];
                        next[idx] = { ...next[idx], badge: e.target.value };
                        setConfig((prev) => ({ ...prev, events: next }));
                      }}
                      className="w-full rounded-md border border-[var(--dba-border)] px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--dba-text-secondary)] mb-1">
                      Texto del Botón
                    </label>
                    <input
                      type="text"
                      value={ev.buttonText}
                      onChange={(e) => {
                        const next = [...config.events];
                        next[idx] = { ...next[idx], buttonText: e.target.value };
                        setConfig((prev) => ({ ...prev, events: next }));
                      }}
                      className="w-full rounded-md border border-[var(--dba-border)] px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. FORMULARIO DE REGISTRO */}
      {activeTab === 'register' && (
        <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--dba-border)] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--dba-text-primary)]">
                Textos del Formulario de Registro en Pasos ("¡Regístrate!")
              </h2>
              <p className="text-xs text-[var(--dba-text-secondary)]">
                Controla la visibilidad del módulo de admisión en el landing.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.showSectionRegister}
                onChange={(e) => setConfig((prev) => ({ ...prev, showSectionRegister: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2 text-xs font-bold">
                {config.showSectionRegister ? 'Visible' : 'Oculto'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Insignia
              </label>
              <input
                type="text"
                value={config.registerBadge}
                onChange={(e) => setConfig((prev) => ({ ...prev, registerBadge: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Título Principal
              </label>
              <input
                type="text"
                value={config.registerTitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, registerTitle: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Subtítulo
              </label>
              <input
                type="text"
                value={config.registerSubtitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, registerSubtitle: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Título al Completar Registro
              </label>
              <input
                type="text"
                value={config.registerSuccessTitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, registerSuccessTitle: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Mensaje de Éxito al Completar
              </label>
              <input
                type="text"
                value={config.registerSuccessDesc}
                onChange={(e) => setConfig((prev) => ({ ...prev, registerSuccessDesc: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* 10. TECNOLOGÍAS DOMINADAS */}
      {activeTab === 'technologies' && (
        <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--dba-border)] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--dba-text-primary)]">
                Herramientas y Tecnologías que Dominarás en DB Academy
              </h2>
              <p className="text-xs text-[var(--dba-text-secondary)]">
                Controla la franja de logos y badges de habilidades técnicas.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.showSectionTechnologies}
                onChange={(e) => setConfig((prev) => ({ ...prev, showSectionTechnologies: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2 text-xs font-bold">
                {config.showSectionTechnologies ? 'Visible' : 'Oculta'}
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
              Título de la Franja de Tecnologías
            </label>
            <input
              type="text"
              value={config.technologiesTitle}
              onChange={(e) => setConfig((prev) => ({ ...prev, technologiesTitle: e.target.value }))}
              className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
              Lista de Herramientas (Separadas por comas)
            </label>
            <textarea
              rows={3}
              value={config.technologiesList.join(', ')}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  technologiesList: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
              className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
            />
          </div>
        </div>
      )}

      {/* 11. PREGUNTAS FRECUENTES (FAQ) */}
      {activeTab === 'faq' && (
        <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--dba-border)] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--dba-text-primary)]">
                Preguntas Frecuentes (FAQ Accordion)
              </h2>
              <p className="text-xs text-[var(--dba-text-secondary)]">
                Modifica respuestas, agrega nuevas preguntas o muestra/oculta el acordeón.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showSectionFaq}
                  onChange={(e) => setConfig((prev) => ({ ...prev, showSectionFaq: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-xs font-bold">
                  {config.showSectionFaq ? 'Visible' : 'Oculta'}
                </span>
              </label>

              <button
                type="button"
                onClick={handleAddFaq}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)] px-3 py-1.5 text-xs font-bold hover:bg-[var(--dba-accent-hover)] transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Pregunta</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Insignia
              </label>
              <input
                type="text"
                value={config.faqBadge}
                onChange={(e) => setConfig((prev) => ({ ...prev, faqBadge: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Título
              </label>
              <input
                type="text"
                value={config.faqTitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, faqTitle: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Subtítulo
              </label>
              <input
                type="text"
                value={config.faqSubtitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, faqSubtitle: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {config.faqList.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-4 space-y-2.5 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[var(--dba-accent-ink)]">
                    Pregunta #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFaq(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Eliminar pregunta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--dba-text-secondary)] mb-1">
                    Pregunta
                  </label>
                  <input
                    type="text"
                    value={faq.q}
                    onChange={(e) => {
                      const next = [...config.faqList];
                      next[idx] = { ...next[idx], q: e.target.value };
                      setConfig((prev) => ({ ...prev, faqList: next }));
                    }}
                    className="w-full rounded-md border border-[var(--dba-border)] px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--dba-text-secondary)] mb-1">
                    Respuesta
                  </label>
                  <textarea
                    rows={2}
                    value={faq.a}
                    onChange={(e) => {
                      const next = [...config.faqList];
                      next[idx] = { ...next[idx], a: e.target.value };
                      setConfig((prev) => ({ ...prev, faqList: next }));
                    }}
                    className="w-full rounded-md border border-[var(--dba-border)] px-3 py-2 text-xs leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 12. FOOTER & CONTACTO */}
      {activeTab === 'footer' && (
        <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-6 space-y-4">
          <h2 className="text-sm font-bold text-[var(--dba-text-primary)] border-b border-[var(--dba-border)] pb-2">
            Pie de Página (Footer), Soporte Institucional y Textos Legales
          </h2>

          <div>
            <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
              Descripción Institucional del Footer
            </label>
            <textarea
              rows={2}
              value={config.footerDescription}
              onChange={(e) => setConfig((prev) => ({ ...prev, footerDescription: e.target.value }))}
              className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Email de Contacto General
              </label>
              <input
                type="email"
                value={config.contactEmail}
                onChange={(e) => setConfig((prev) => ({ ...prev, contactEmail: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Email de Soporte Académico
              </label>
              <input
                type="email"
                value={config.supportEmail}
                onChange={(e) => setConfig((prev) => ({ ...prev, supportEmail: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Teléfono de Atención al Estudiante
              </label>
              <input
                type="text"
                value={config.contactPhone}
                onChange={(e) => setConfig((prev) => ({ ...prev, contactPhone: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Dirección / Sede Central (RD)
              </label>
              <input
                type="text"
                value={config.contactAddress}
                onChange={(e) => setConfig((prev) => ({ ...prev, contactAddress: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[var(--dba-border)]">
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Copyright Text
              </label>
              <input
                type="text"
                value={config.footerCopyright}
                onChange={(e) => setConfig((prev) => ({ ...prev, footerCopyright: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Etiqueta Términos y Condiciones
              </label>
              <input
                type="text"
                value={config.footerTermsLabel}
                onChange={(e) => setConfig((prev) => ({ ...prev, footerTermsLabel: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1">
                Etiqueta Políticas de Privacidad
              </label>
              <input
                type="text"
                value={config.footerPrivacyLabel}
                onChange={(e) => setConfig((prev) => ({ ...prev, footerPrivacyLabel: e.target.value }))}
                className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Bar */}
      <div className="sticky bottom-4 z-30 rounded-xl border border-[var(--dba-border-strong)] bg-[var(--dba-bg-surface)]/95 backdrop-blur p-4 shadow-xl flex items-center justify-between gap-4">
        <span className="text-xs font-semibold text-[var(--dba-text-secondary)] hidden sm:inline">
          💡 Las secciones desactivadas se ocultan del landing y se eliminan automáticamente del menú de navegación.
        </span>

        <div className="flex items-center gap-3 ml-auto">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Restablecer
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-6 py-2.5 text-xs font-extrabold text-[var(--dba-accent-foreground)] shadow-md transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración del Landing</span>
          </button>
        </div>
      </div>
    </div>
  );
};
