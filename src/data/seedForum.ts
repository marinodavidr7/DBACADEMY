import type { ForumThread, ForumReply } from '../types';

export const SEED_FORUM_THREADS: ForumThread[] = [
  {
    id: 'thr_bienvenida_excel',
    courseId: 'excel-basico-05',
    authorId: 'platform-faculty',
    authorName: 'Equipo DB Academy',
    title: 'Foro de bienvenida: Curso de Excel',
    body: `Sobre este foro
¡Te damos la bienvenida al Curso de Excel de DB Academy! Este foro es el primer punto de encuentro con la comunidad del curso. Aquí podrás presentarte, compartir tu experiencia utilizando hojas de cálculo y contar qué te motivó a fortalecer tus conocimientos en Excel.

No importa si utilizas Excel con frecuencia o si estás dando tus primeros pasos. Lo importante es reconocer desde qué nivel comienzas, qué tareas realizas actualmente y qué esperas lograr al aprender a organizar, calcular, analizar y presentar información de manera más eficiente.

¿Qué incluir en tu presentación?
• Tu nombre y desde qué país o ciudad participas.
• A qué te dedicas actualmente o qué estás estudiando.
• Qué experiencia tienes utilizando Excel u otras herramientas de hojas de cálculo.

Reflexiona y comparte
• ¿Qué te motivó a inscribirte en este Curso de Excel?
• ¿Qué tarea te gustaría realizar de forma más rápida, organizada o precisa utilizando Excel?
• ¿En qué contexto académico, laboral o personal esperas aplicar lo aprendido?

Un ejemplo para inspirarte
"¡Hola! Soy Daniel y trabajo en el área administrativa de una empresa. Actualmente utilizo Excel para registrar información y hacer cálculos sencillos, pero quiero aprender a organizar mejor los datos y aprovechar las fórmulas, funciones, tablas y gráficos. Mi objetivo es elaborar reportes con mayor rapidez y reducir errores en las tareas que realizo cada semana."`,
    pinned: true,
    resolved: false,
    upvotesCount: 28,
    repliesCount: 2,
    createdAt: '2026-11-20T12:00:00.000Z',
    updatedAt: '2026-11-21T14:00:00.000Z',
  },
];

export const SEED_FORUM_REPLIES: Record<string, ForumReply[]> = {
  thr_bienvenida_excel: [
    {
      id: 'rep_bienvenida_profesor',
      threadId: 'thr_bienvenida_excel',
      courseId: 'excel-basico-05',
      authorId: 'platform-faculty',
      authorName: 'Prof. Marino David (DB Academy)',
      isInstructorAnswer: true,
      body: '¡Bienvenidos a todos a DB Academy! Me alegra mucho tenerlos aquí. Recuerden que este curso es 100% práctico y cuenta con un simulador interactivo de fórmulas en tiempo real. Cualquier consulta sobre los ejercicios, publíquenla con confianza en este foro.',
      createdAt: '2026-11-20T12:30:00.000Z',
    },
    {
      id: 'rep_bienvenida_daniel',
      threadId: 'thr_bienvenida_excel',
      courseId: 'excel-basico-05',
      authorId: 'student_daniel_ejemplo',
      authorName: 'Daniel Fuentes García',
      isInstructorAnswer: false,
      body: '¡Hola a todos! Soy Daniel, trabajo en administración en Santo Domingo. Utilizo Excel a diario para registrar datos y espero dominar las funciones lógicas (=SI, =BUSCARX) y tablas dinámicas en este curso. ¡Mucho éxito a todos los compañeros!',
      createdAt: '2026-11-20T14:15:00.000Z',
    },
  ],
};
