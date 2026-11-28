import { getAuth } from 'firebase/auth';

export interface LandingStat {
  value: string;
  label: string;
}

export interface LandingTrack {
  id: string;
  badge: string;
  title: string;
  description: string;
  buttonText: string;
  tags: string[];
}

export interface LandingPillar {
  title: string;
  desc: string;
}

export interface LandingEventItem {
  id: string;
  title: string;
  date: string;
  speaker: string;
  mode: string;
  badge: string;
  buttonText: string;
}

export interface LandingFaqItem {
  q: string;
  a: string;
}

export interface LandingConfig {
  // 0. VISIBILIDAD DE SECCIONES (ACTIVAR / DESACTIVAR)
  showSectionBanner: boolean;
  showSectionStats: boolean;
  showSectionAbout: boolean;
  showSectionTracks: boolean;
  showSectionCourses: boolean;
  showSectionEvents: boolean;
  showSectionRegister: boolean;
  showSectionTechnologies: boolean;
  showSectionFaq: boolean;

  // 1. MODO NAVIDAD
  christmasMode: boolean;
  christmasGreeting: string;
  showSnow: boolean;
  showSantaHat: boolean;

  // 2. BANNER DE ANUNCIO SUPERIOR
  bannerActive: boolean;
  bannerText: string;
  bannerLinkText: string;
  bannerLinkUrl: string;

  // 3. ENCABEZADO Y NAVEGACIÓN
  navHomeLabel: string;
  navAboutLabel: string;
  navTracksLabel: string;
  navCoursesLabel: string;
  navEventsLabel: string;
  navRegisterLabel: string;
  navFaqLabel: string;
  navCtaExploreText: string;
  navCtaLearningText: string;

  // 4. HERO PRINCIPAL
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  heroTrustChips: string[];

  // 5. CAMPUS PREVIEW CARD
  campusBadge: string;
  campusSubtext: string;

  // 6. MÉTRICAS DE IMPACTO (TALENTO DIGITAL COUNTERS)
  stats: [LandingStat, LandingStat, LandingStat, LandingStat];

  // 7. SECCIÓN "ACERCA DE" Y PILARES
  aboutBadge: string;
  aboutTitle: string;
  aboutDescription: string;
  aboutHighlightText: string;
  aboutPillars: [LandingPillar, LandingPillar, LandingPillar, LandingPillar];

  // 8. RUTAS DE APRENDIZAJE (CAREER TRACKS)
  tracksBadge: string;
  tracksTitle: string;
  tracksSubtitle: string;
  tracks: [LandingTrack, LandingTrack];

  // 9. SECCIÓN CURSOS
  coursesBadge: string;
  coursesTitle: string;
  coursesSubtitle: string;
  coursesCatalogLinkText: string;

  // 10. EVENTOS Y MASTERCLASSES
  eventsBadge: string;
  eventsTitle: string;
  eventsSubtitle: string;
  events: LandingEventItem[];

  // 11. FORMULARIO DE REGISTRO (¡REGÍSTRATE!)
  registerBadge: string;
  registerTitle: string;
  registerSubtitle: string;
  registerSuccessTitle: string;
  registerSuccessDesc: string;

  // 12. TECNOLOGÍAS DOMINADAS
  technologiesTitle: string;
  technologiesList: string[];

  // 13. PREGUNTAS FRECUENTES (FAQ)
  faqBadge: string;
  faqTitle: string;
  faqSubtitle: string;
  faqList: LandingFaqItem[];

  // 14. FOOTER INSTITUCIONAL
  footerDescription: string;
  footerLocation: string;
  contactEmail: string;
  supportEmail: string;
  contactPhone: string;
  contactAddress: string;
  footerCommunityTitle: string;
  footerCommunityDesc: string;
  footerCopyright: string;
  footerTermsLabel: string;
  footerPrivacyLabel: string;
}

export const DEFAULT_LANDING_CONFIG: LandingConfig = {
  // Visibilidad de Secciones por Defecto
  showSectionBanner: true,
  showSectionStats: true,
  showSectionAbout: true,
  showSectionTracks: true,
  showSectionCourses: true,
  showSectionEvents: true,
  showSectionRegister: true,
  showSectionTechnologies: true,
  showSectionFaq: true,

  // Modo Navidad
  // Diciembre se activa automáticamente desde holidays.config.ts; el admin puede forzar ON/OFF.
  christmasMode: false,
  christmasGreeting: '🎄 ¡Temporada Navideña en DB Academy! Impulsa tu futuro profesional con becas y beneficios especiales.',
  showSnow: true,
  showSantaHat: true,

  // Banner Superior
  bannerActive: true,
  bannerText: '¡Inscripciones abiertas para el nuevo grupo de formación técnica y analítica!',
  bannerLinkText: 'Ver detalles',
  bannerLinkUrl: '#rutas',

  // Navegación
  navHomeLabel: 'Inicio',
  navAboutLabel: 'Acerca de',
  navTracksLabel: 'Rutas',
  navCoursesLabel: 'Cursos',
  navEventsLabel: 'Eventos',
  navRegisterLabel: 'Registro',
  navFaqLabel: 'Preguntas',
  navCtaExploreText: 'Explorar cursos',
  navCtaLearningText: 'Mi Aprendizaje',

  // Hero
  heroBadge: 'Formación técnica orientada al empleo y crecimiento · DB Academy',
  heroTitle: 'Mejora tus habilidades, impulsa tu futuro',
  heroSubtitle: 'Desarrolla las habilidades técnicas y digitales que están moviendo el mercado laboral y abriendo puertas para tu crecimiento profesional o para crear y escalar proyectos propios.',
  heroCtaPrimary: 'Explorar Rutas y Cursos',
  heroCtaSecondary: 'Acceso a Estudiantes',
  heroTrustChips: [
    'Metodología Flexible (a tu ritmo)',
    'Simuladores Interactivos 3D',
    'Certificados Oficiales con QR',
  ],

  // Campus Preview
  campusBadge: 'Campus Virtual Activo',
  campusSubtext: 'Formación Práctica por Módulos y Evaluación en Tiempo Real',

  // Métricas
  stats: [
    { value: '+3,500', label: 'Estudiantes Capacitados' },
    { value: '2', label: 'Rutas de Aprendizaje' },
    { value: '14+', label: 'Ejes Temáticos de Alta Demanda' },
    { value: '+120', label: 'Horas de Formación y Simuladores' },
  ],

  // Acerca de
  aboutBadge: 'Acerca de DB Academy',
  aboutTitle: 'Educación Transformadora con Práctica Real',
  aboutDescription: 'DB Academy es una plataforma técnica especializada diseñada para el fortalecimiento de habilidades digitales, analítica de datos y herramientas de alta productividad orientadas al empleo formal y al emprendimiento.',
  aboutHighlightText: 'Con una metodología flexible y un entorno digital diseñado para el aprendizaje práctico, combinamos contenidos asincrónicos, simuladores interactivos 3D, laboratorios guiados y acompañamiento pedagógico.',
  aboutPillars: [
    {
      title: 'Metodología Flexible',
      desc: 'Aprende a tu propio ritmo con contenidos asincrónicos organizados de forma secuencial y acceso disponible 24/7.',
    },
    {
      title: 'Simuladores 3D y Práctica',
      desc: 'Aprende practicando con entornos interactivos en tiempo real que emulan herramientas laborales reales.',
    },
    {
      title: 'Acompañamiento Experto',
      desc: 'Foros de discusión técnicos, revisión de entregas y sesiones de mentoría en vivo para resolver dudas.',
    },
    {
      title: 'Certificación con QR',
      desc: 'Diplomas oficiales con código único de verificación institucional y tecnología de validación digital.',
    },
  ],

  // Rutas
  tracksBadge: 'Educación Transformadora',
  tracksTitle: 'Rutas de Aprendizaje',
  tracksSubtitle: 'Cursos y trayectos formativos pensados para trabajar en el sector tecnológico o emprender en el mundo digital.',
  tracks: [
    {
      id: 'tech-career',
      badge: 'Ruta de Empleabilidad & Tecnología',
      title: '¿Quieres trabajar en el sector tech?',
      description: 'Fórmate en áreas de alta demanda como Desarrollo Web, Analítica de Datos, Excel Avanzado, Nube y Ciberseguridad. Obtén tu certificación verificable con código QR y conecta con oportunidades laborales.',
      buttonText: 'Ver cursos de Empleabilidad',
      tags: ['Excel Avanzado', 'Python & Datos', 'Desarrollo Web', 'Ciberseguridad Zero-Trust', 'Cloud APIs'],
    },
    {
      id: 'business-growth',
      badge: 'Ruta de Negocios & Productividad',
      title: '¿Quieres impulsar tu emprendimiento?',
      description: 'Desarrolla habilidades clave en analítica de negocios, finanzas operativas, automatización con Power Query/VBA y tableros de control ejecutivos para formalizar y escalar tu negocio.',
      buttonText: 'Ver cursos de Emprendimiento',
      tags: ['Finanzas en Excel', 'Dashboards Ejecutivos', 'Automatización de Tareas', 'Modelado de Negocio'],
    },
  ],

  // Cursos
  coursesBadge: 'Programas Activos',
  coursesTitle: 'Cursos y Certificaciones',
  coursesSubtitle: 'Matricúlate hoy y comienza a desarrollar habilidades con impacto profesional.',
  coursesCatalogLinkText: 'Ver catálogo interactivo',

  // Eventos
  eventsBadge: 'Próximos Encuentros',
  eventsTitle: 'Aprende, conecta y crece',
  eventsSubtitle: 'Participa en nuestros encuentros con expertos y descubre ideas que pueden transformar tu camino profesional.',
  events: [
    {
      id: 'ev-1',
      title: 'Masterclass: Automatización Inteligente de Reportes con Excel y Power Query',
      date: 'Jueves 19:00 (GMT-4)',
      speaker: 'Equipo de Ingeniería DB Academy',
      mode: 'En vivo / Interactivo',
      badge: 'Cupos limitados',
      buttonText: 'Reservar cupo gratis',
    },
    {
      id: 'ev-2',
      title: 'Webinar: Estrategias de Empleabilidad Tech y Portafolio de Certificaciones',
      date: 'Sábado 10:30 (GMT-4)',
      speaker: 'Especialistas en Selección IT',
      mode: 'Transmisión en directo',
      badge: 'Acceso libre',
      buttonText: 'Reservar cupo gratis',
    },
    {
      id: 'ev-3',
      title: 'Taller Práctico: Modelado de Fórmulas Financieras y F4 / ITBIS para República Dominicana',
      date: 'Martes 18:30 (GMT-4)',
      speaker: 'Consultores Fiscales y de Datos',
      mode: 'Laboratorio guiado',
      badge: 'Certificado de asistencia',
      buttonText: 'Reservar cupo gratis',
    },
  ],

  // Registro
  registerBadge: 'Admisión y Acceso',
  registerTitle: '¡Regístrate en el Campus!',
  registerSubtitle: 'Obtén tu acceso al campus virtual, matricúlate y certifícate a tu propio ritmo con validez digital.',
  registerSuccessTitle: '¡Registro Completado con Éxito!',
  registerSuccessDesc: 'Hemos generado tu acceso preliminar. Inicia sesión para entrar directamente al campus.',

  // Tecnologías
  technologiesTitle: 'Herramientas y Tecnologías que Dominarás en DB Academy',
  technologiesList: [
    'Microsoft Excel & 3D',
    'Python & Pandas',
    'Power BI & DAX',
    'SQL & Bases de Datos',
    'React & TypeScript',
    'Cloud & Ciberseguridad',
  ],

  // FAQ
  faqBadge: 'Preguntas Frecuentes',
  faqTitle: '¿Tienes dudas sobre la academia?',
  faqSubtitle: 'Todo lo que necesitas saber antes de iniciar tu experiencia formativa.',
  faqList: [
    {
      q: '¿Cómo funciona la modalidad de los cursos?',
      a: 'Nuestros programas combinan lecciones prácticas asincrónicas con laboratorios guiados y simuladores interactivos 3D. Puedes avanzar en tus propios horarios y complementar con foros y sesiones en vivo.',
    },
    {
      q: '¿Los certificados tienen validez y verificación?',
      a: 'Sí. Todos los certificados emitidos por DB Academy cuentan con un código único de verificación criptográfica (SHA-256) y código QR verificable en línea por reclutadores y empresas.',
    },
    {
      q: '¿Qué requisitos técnicos necesito?',
      a: 'Solo requieres una computadora con acceso a internet. La plataforma funciona directamente en el navegador y es compatible con dispositivos móviles mediante nuestra PWA instalable.',
    },
    {
      q: '¿Cómo puedo pagar o aplicar a becas?',
      a: 'Aceptamos tarjetas de crédito/débito internacionales a través de pasarelas seguras (Lemon Squeezy), cupones promocionales y Gift Cards institucionales.',
    },
  ],

  // Footer
  footerDescription: 'DB Academy es una institución técnica multidisciplinaria comprometida con el desarrollo de competencias prácticas en tecnología, análisis de datos y herramientas de alta productividad.',
  footerLocation: 'República Dominicana · Campus Digital',
  contactEmail: 'contacto@dbacademy.do',
  supportEmail: 'soporte@dbacademy.do',
  contactPhone: '+1 (809) 555-0199',
  contactAddress: 'Santo Domingo, Distrito Nacional, República Dominicana',
  footerCommunityTitle: 'Comunidad Digital',
  footerCommunityDesc: 'Participa en nuestros foros y eventos mensuales para conectar con profesores y estudiantes.',
  footerCopyright: '© 2026 DB Academy. Todos los derechos reservados.',
  footerTermsLabel: 'Términos y Condiciones',
  footerPrivacyLabel: 'Políticas de Privacidad',
};

const STORAGE_KEY = 'dba_landing_config_v2';
const EVENT_NAME = 'dba_landing_config_updated';
const API_URL = '/api/landing-config';
const POLL_INTERVAL_MS = 5000;

function normalizeConfig(parsed?: Partial<LandingConfig> | null): LandingConfig {
  if (!parsed || typeof parsed !== 'object') return DEFAULT_LANDING_CONFIG;
  return {
    ...DEFAULT_LANDING_CONFIG,
    ...parsed,
    stats: parsed.stats || DEFAULT_LANDING_CONFIG.stats,
    tracks: parsed.tracks || DEFAULT_LANDING_CONFIG.tracks,
    aboutPillars: parsed.aboutPillars || DEFAULT_LANDING_CONFIG.aboutPillars,
    events: parsed.events || DEFAULT_LANDING_CONFIG.events,
    faqList: parsed.faqList || DEFAULT_LANDING_CONFIG.faqList,
    technologiesList: parsed.technologiesList || DEFAULT_LANDING_CONFIG.technologiesList,
    heroTrustChips: parsed.heroTrustChips || DEFAULT_LANDING_CONFIG.heroTrustChips,
  };
}

function readCachedConfig(): LandingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeConfig(raw ? JSON.parse(raw) : null);
  } catch (err) {
    console.warn('Error reading cached landing config:', err);
    return DEFAULT_LANDING_CONFIG;
  }
}

function publishLocal(config: LandingConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('No se pudo cachear la configuración del landing:', err);
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: config }));
}

/** API síncrona intacta: lee la caché local o los valores por defecto. */
export function getLandingConfig(): LandingConfig {
  return readCachedConfig();
}

/** Carga la configuración compartida desde el servidor (Supabase). */
export async function loadLandingConfig(): Promise<LandingConfig> {
  try {
    const response = await fetch(API_URL, { cache: 'no-store' });
    if (!response.ok) return readCachedConfig();
    const payload = (await response.json()) as { config?: Partial<LandingConfig> | null };
    if (!payload?.config) return readCachedConfig();
    const config = normalizeConfig(payload.config);
    publishLocal(config);
    return config;
  } catch (err) {
    console.warn('No se pudo cargar la configuración compartida del landing:', err);
    return readCachedConfig();
  }
}

/** Guarda en Supabase (sólo admin en el servidor) y actualiza la caché local. */
export async function saveLandingConfig(config: LandingConfig): Promise<void> {
  publishLocal(config);
  const currentUser = getAuth().currentUser;
  if (!currentUser) {
    throw new Error('Debes iniciar sesión como administrador para guardar la configuración del landing.');
  }
  const idToken = await currentUser.getIdToken();
  const response = await fetch(API_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      (payload && typeof payload.error === 'string' && payload.error) ||
      `No se pudo sincronizar la configuración del landing (${response.status})`;
    throw new Error(message);
  }
}

/** Restablece los valores oficiales en Supabase y en la caché local. */
export async function resetLandingConfig(): Promise<LandingConfig> {
  publishLocal(DEFAULT_LANDING_CONFIG);
  await saveLandingConfig(DEFAULT_LANDING_CONFIG);
  return DEFAULT_LANDING_CONFIG;
}

/**
 * Suscripción con sincronización entre navegadores: mantiene eventos locales
 * y sondea el backend cada 5 s para reflejar cambios hechos por el administrador.
 */
export function subscribeLandingConfig(callback: (config: LandingConfig) => void): () => void {
  let lastSerialized = JSON.stringify(readCachedConfig());

  const apply = (config: LandingConfig) => {
    lastSerialized = JSON.stringify(config);
    callback(config);
  };

  const handler = (event: Event) => {
    const custom = event as CustomEvent<LandingConfig>;
    apply(custom.detail ? normalizeConfig(custom.detail) : readCachedConfig());
  };
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);

  const poll = async () => {
    try {
      const response = await fetch(API_URL, { cache: 'no-store' });
      if (!response.ok) return;
      const payload = (await response.json()) as { config?: Partial<LandingConfig> | null };
      if (!payload?.config) return;
      const config = normalizeConfig(payload.config);
      const serialized = JSON.stringify(config);
      if (serialized === lastSerialized) return;
      lastSerialized = serialized;
      try {
        localStorage.setItem(STORAGE_KEY, serialized);
      } catch {
        // cache opcional
      }
      callback(config);
    } catch {
      // sin conexión: se conserva la configuración en caché
    }
  };

  const interval = window.setInterval(() => void poll(), POLL_INTERVAL_MS);
  void poll();

  return () => {
    window.clearInterval(interval);
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
}
