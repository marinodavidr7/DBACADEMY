export const LANDING_COPY = {
  nav: {
    benefits: 'Beneficios',
    how: 'Cómo funciona',
    courses: 'Cursos',
    security: 'Seguridad',
    faq: 'Preguntas',
    signIn: 'Iniciar sesión',
  },
  hero: {
    badge: 'Formación técnica, sin fricción',
    title: 'Aprende con foco.',
    titleAccent: 'Enseña con control.',
    subtitle:
      'Una plataforma para impartir y cursar programas profesionales: pagos integrados, progreso en tiempo real, foros, certificados verificables y tus apuntes cifrados de extremo a extremo.',
    primary: 'Empezar con Google',
    secondary: 'Explorar sin cuenta',
    note: 'Puedes recorrer el catálogo antes de crear una cuenta.',
    mockTitle: 'Mi progreso',
    mockSubtitle: 'Sincronizado en tiempo real',
    mockStats: ['Cursos activos', 'Horas de estudio', 'Certificados'],
    mockCourse: 'Arquitectura de Sistemas Distribuidos',
    mockProgress: 'Progreso del curso',
  },
  stats: [
    { value: '3', label: 'pasarelas de pago' },
    { value: '4', label: 'idiomas disponibles' },
    { value: 'AES-256', label: 'cifrado de extremo a extremo' },
    { value: 'Tiempo real', label: 'sincronización entre dispositivos' },
  ],
  problem: {
    eyebrow: 'El problema',
    title: 'Enseñar y aprender no debería bailar entre cinco herramientas',
    subtitle:
      'Cobrar en un sitio, seguir el avance en otro, preguntar en un grupo externo y emitir un certificado a mano rompe el ritmo de cualquier programa formativo.',
    items: [
      {
        title: 'Todo separado, nada conectado',
        body: 'Pago, contenido, dudas y certificación viven en sistemas distintos y nadie tiene una visión completa del progreso.',
      },
      {
        title: 'El avance se queda en un dispositivo',
        body: 'Cambiar de equipo significa perder el ritmo, las notas y las fechas límite justo cuando más se necesitan.',
      },
    ],
  },
  features: {
    eyebrow: 'Qué incluye',
    title: 'Todo el ciclo formativo en un solo lugar',
    subtitle:
      'Cada función está pensada para que profesores y estudiantes se centren en enseñar y aprender, no en administrar herramientas.',
    items: [
      {
        title: 'Pagos sin salir del curso',
        body: 'Inscripción con Stripe, MercadoPago o PayPal y acceso desbloqueado al confirmar la autorización.',
      },
      {
        title: 'Progreso en vivo',
        body: 'Lecciones, evaluaciones y panel del profesor actualizados al instante en todos los dispositivos conectados.',
      },
      {
        title: 'Foros que responden',
        body: 'Debates por curso, respuestas destacadas del profesor y temas fijados o marcados como resueltos.',
      },
      {
        title: 'Certificados verificables',
        body: 'Emisión automática al completar el programa, con código de verificación y descarga en PDF.',
      },
      {
        title: 'Fechas bajo control',
        body: 'Calendario de entregas, exámenes y sesiones en vivo con recordatorios y alertas push.',
      },
      {
        title: 'Notas realmente privadas',
        body: 'Bóveda cifrada AES-GCM-256 en el navegador, con respaldos en la nube e integraciones API.',
      },
    ],
  },
  how: {
    eyebrow: 'Cómo funciona',
    title: 'Tres pasos, de la duda al certificado',
    steps: [
      {
        title: 'Elige tu programa',
        body: 'Explora el catálogo por área y nivel, revisa los módulos y asegura tu plaza con el método de pago que prefieras.',
      },
      {
        title: 'Avanza y pregunta',
        body: 'Completa lecciones y evaluaciones, participa en los foros y recibe avisos de tus próximas fechas límite.',
      },
      {
        title: 'Certifica y compártelo',
        body: 'Al llegar al 100 % se genera un certificado con código verificable que puedes descargar en PDF.',
      },
    ],
  },
  courses: {
    eyebrow: 'Catálogo',
    title: 'Empieza por un tema que te importe',
    subtitle: 'Programas reales del catálogo, con sus módulos, nivel y precio desde el primer día.',
    level: { beginner: 'Inicial', intermediate: 'Intermedio', advanced: 'Avanzado' },
    lessons: 'lecciones',
    modules: 'módulos',
    action: 'Ver en el catálogo',
  },
  instructors: {
    eyebrow: 'Para profesores',
    title: 'Tu curso, tus alumnos, tus números',
    body: 'Publica programas, revisa el avance de cada estudiante y consulta ingresos, certificados y panorama general desde un único panel.',
    points: [
      'Creación de cursos por módulos y lecciones con evaluaciones',
      'Panel con alumnos inscritos, ingresos y progreso promedio',
      'Foros moderables y emisión automática de certificados',
    ],
    action: 'Abrir el panel',
  },
  security: {
    eyebrow: 'Seguridad',
    title: 'Tu conocimiento, bajo tu control',
    body: 'Las notas se cifran en el navegador antes de salir del dispositivo. Las reglas de acceso separan lo público de lo privado y los certificados llevan una firma verificable.',
    points: [
      'Bóveda personal con cifrado AES-GCM-256',
      'Acceso por usuario y reglas de base de datos por documento',
      'Códigos de verificación para cada certificado emitido',
    ],
  },
  faq: {
    eyebrow: 'Preguntas frecuentes',
    title: 'Lo que suele preguntarse antes de empezar',
    items: [
      {
        q: '¿Necesito una cuenta para mirar los cursos?',
        a: 'No. Puedes explorar el catálogo sin cuenta. Inicia sesión con Google cuando quieres inscribirte, guardar tu progreso o sincronizar tus dispositivos.',
      },
      {
        q: '¿Qué métodos de pago hay?',
        a: 'La inscripción puede autorizarse con Stripe, MercadoPago o PayPal. El curso se desbloquea al confirmarse el pago.',
      },
      {
        q: '¿Puedo estudiar desde varios dispositivos?',
        a: 'Sí. El progreso, el calendario y las notificaciones se sincronizan entre dispositivos conectados. La app también funciona como PWA e indica cuando estás sin conexión.',
      },
      {
        q: '¿Cómo se verifica un certificado?',
        a: 'Cada certificado tiene un código propio y una firma. Puedes introducir el código en la sección de certificados para comprobar su validez y descargar el PDF.',
      },
      {
        q: '¿En qué idiomas está la plataforma?',
        a: 'La interfaz está disponible en español, inglés, francés y portugués, con selector de idioma y tema claro u oscuro.',
      },
    ],
  },
  final: {
    title: 'Tu próximo curso empieza aquí',
    subtitle: 'Entra a la plataforma, elige un programa y empieza a avanzar hoy mismo.',
    primary: 'Entrar a DB Academy',
    secondary: 'Ver el catálogo',
  },
  footer: {
    tagline: 'Plataforma de cursos virtuales para estudiantes y profesores.',
    note: 'Pagos, progreso, foros, certificación y seguridad en un mismo lugar.',
  },
} as const;
