import { EXCEL_CURRICULUM_MOD0 } from './excelCurriculumMod0';
import { EXCEL_CURRICULUM_FOUNDATIONS } from './excelCurriculumFoundations';
import { EXTRA_FOUNDATION_EXERCISES } from './excelCurriculumFoundationsExtra';
import { EXCEL_CURRICULUM_MOD1A } from './excelCurriculumMod1A';
import { EXCEL_CURRICULUM_MOD1B } from './excelCurriculumMod1B';
import type { ExcelExercise, ExcelLessonCurriculum } from './excelCurriculumTypes';

export type {
  ExcelArgumentDoc,
  ExcelExercise,
  ExcelFunctionExplanation,
  ExcelLessonCurriculum,
  ExcelPracticalExample,
} from './excelCurriculumTypes';

const PLATFORM_PRACTICES_PER_CHAPTER = 10;

function normalizeLessonExercises(
  lessonId: string,
  base: ExcelLessonCurriculum,
  overrideExercises?: ExcelExercise[]
): ExcelLessonCurriculum {
  const source = overrideExercises ?? base.exercises;
  const exercises = source
    .slice(0, PLATFORM_PRACTICES_PER_CHAPTER)
    .map((ex, idx) => ({
      ...ex,
      number: idx + 1,
    }));
  return {
    ...base,
    lessonId,
    exercises,
  };
}

function mergeFoundation(lessonId: string): ExcelLessonCurriculum {
  const base = EXCEL_CURRICULUM_FOUNDATIONS[lessonId];
  const extras = EXTRA_FOUNDATION_EXERCISES[lessonId] ?? [];
  return normalizeLessonExercises(lessonId, base, [...base.exercises, ...extras]);
}

const mod19 = EXCEL_CURRICULUM_MOD1B['les-excel-1-9'];
const mod110 = EXCEL_CURRICULUM_MOD1B['les-excel-1-10'];

// 5 ejercicios representativos de ENTERO/TRUNCAR/RESIDUO + 5 de POTENCIA/RAIZ/ABS = 10 exactos
const CURATED_4_3_EXERCISES: ExcelExercise[] = [
  mod19.exercises[0],
  mod19.exercises[1],
  mod19.exercises[4],
  mod19.exercises[5],
  mod19.exercises[8],
  mod110.exercises[0],
  mod110.exercises[1],
  mod110.exercises[4],
  mod110.exercises[8],
  mod110.exercises[9],
];

const EXCEL_CURRICULUM_4_3: ExcelLessonCurriculum = normalizeLessonExercises(
  'les-excel-4-3',
  {
    lessonId: 'les-excel-4-3',
    introduction:
      'ENTERO, TRUNCAR y RESIDUO descomponen números en parte entera, corte decimal exacto o resto de división; POTENCIA, RAIZ y ABS resuelven exponentes, raíces cuadradas y desviaciones sin signo.',
    keyTakeaways: [...mod19.keyTakeaways, ...mod110.keyTakeaways],
    functions: [...mod19.functions, ...mod110.functions],
    examples: [...mod19.examples, ...mod110.examples],
    exercises: CURATED_4_3_EXERCISES,
  },
  CURATED_4_3_EXERCISES
);

const mod113 = EXCEL_CURRICULUM_MOD1B['les-excel-1-13'];

const EXCEL_CURRICULUM_4_12: ExcelLessonCurriculum = normalizeLessonExercises('les-excel-4-12', {
  lessonId: 'les-excel-4-12',
  introduction:
    'La función SI es la base de la toma de decisiones en Excel. Permite evaluar una condición lógica y devolver un resultado cuando se cumple (VERDADERO) y otro cuando no se cumple (FALSO). En esta lección trabajarás SI simple para clasificar, validar y calcular resultados según una condición.',
  keyTakeaways: [
    'Sintaxis: =SI(prueba_lógica; valor_si_verdadero; [valor_si_falso]). Los textos van entre comillas y los números sin comillas.',
    'La prueba lógica compara valores con operadores como >=, <=, >, <, = o <>.',
    'El valor_si_verdadero y el valor_si_falso pueden ser texto, números, celdas o fórmulas simples.',
  ],
  functions: [mod113.functions[0]],
  examples: [mod113.examples[0], mod113.examples[3]],
  exercises: [
    mod113.exercises.find(e => e.id === 'les113-ej1')!,
    mod113.exercises.find(e => e.id === 'les113-ej2')!,
    mod113.exercises.find(e => e.id === 'les113-ej3')!,
    mod113.exercises.find(e => e.id === 'les113-ej4')!,
    mod113.exercises.find(e => e.id === 'les113-ej12')!,
    mod113.exercises.find(e => e.id === 'les113-ej13')!,
    {
      id: 'les412-ej7',
      number: 7,
      functionTag: 'SI · Texto',
      title: 'Clasificar estado de entrega',
      prompt: 'En C2 escribe =SI(B2="Entregado";"Cerrado";"Pendiente") para clasificar el estado del pedido.',
      hint: 'Compara texto con = y escribe los resultados entre comillas.',
      targetCell: 'C2',
      solutionFormula: '=SI(B2="Entregado";"Cerrado";"Pendiente")',
      initialSheet: { A1: 'Pedido', B1: 'Estado', C1: 'Seguimiento', D1: 'Responsable', A2: 'P-01', B2: 'Entregado', C2: '', D2: 'Ana' },
      validate: (f: string, v: unknown) => {
        const fn = String(f ?? '').replace(/\s/g, '');
        const ok = /^=(SI|IF)\(B2="Entregado";"Cerrado";"Pendiente"\)$/i.test(fn);
        return { ok: ok && String(v) === 'Cerrado', feedback: ok && String(v) === 'Cerrado' ? '¡Correcto! El pedido entregado se marca como "Cerrado".' : 'Usa =SI(B2="Entregado";"Cerrado";"Pendiente") en C2.' };
      },
    },
    {
      id: 'les412-ej8',
      number: 8,
      functionTag: 'SI · Comparación',
      title: 'Detectar inventario bajo',
      prompt: 'En D2 escribe =SI(C2<10;"Reponer";"OK") para marcar productos con stock menor a 10.',
      hint: 'La prueba lógica es C2<10.',
      targetCell: 'D2',
      solutionFormula: '=SI(C2<10;"Reponer";"OK")',
      initialSheet: { A1: 'Producto', B1: 'Categoría', C1: 'Stock', D1: 'Alerta', A2: 'Mouse', B2: 'Accesorios', C2: 4, D2: '' },
      validate: (f: string, v: unknown) => {
        const fn = String(f ?? '').replace(/\s/g, '');
        const ok = /^=(SI|IF)\(C2<10;"Reponer";"OK"\)$/i.test(fn);
        return { ok: ok && String(v) === 'Reponer', feedback: ok && String(v) === 'Reponer' ? '¡Bien! Stock 4 es menor que 10, por eso devuelve "Reponer".' : 'Usa =SI(C2<10;"Reponer";"OK") en D2.' };
      },
    },
    {
      id: 'les412-ej9',
      number: 9,
      functionTag: 'SI · Cálculo',
      title: 'Aplicar recargo por mora',
      prompt: 'En C2 escribe =SI(B2>0;B2*1.05;0) para aplicar 5% de recargo cuando hay saldo pendiente.',
      hint: 'Si B2>0, multiplica B2 por 1.05; si no, devuelve 0.',
      targetCell: 'C2',
      solutionFormula: '=SI(B2>0;B2*1.05;0)',
      initialSheet: { A1: 'Cliente', B1: 'Saldo', C1: 'Total con recargo', D1: 'Mes', A2: 'Carlos', B2: 200, C2: '', D2: 'Abril' },
      validate: (f: string, v: unknown) => {
        const fn = String(f ?? '').replace(/\s/g, '');
        const num = Number(String(v).replace(',', '.'));
        const ok = /^=(SI|IF)\(B2>0;B2\*1\.05;0\)$/i.test(fn);
        return { ok: ok && Math.abs(num - 210) < 0.01, feedback: ok && Math.abs(num - 210) < 0.01 ? '¡Correcto! 200 con 5% de recargo da 210.' : 'Usa =SI(B2>0;B2*1.05;0) en C2.' };
      },
    },
    {
      id: 'les412-ej10',
      number: 10,
      functionTag: 'SI · Validación',
      title: 'Validar asistencia mínima',
      prompt: 'En C2 escribe =SI(B2>=80;"Cumple";"No cumple") para indicar si la asistencia alcanza el 80%.',
      hint: 'Compara B2 con 80 usando >=.',
      targetCell: 'C2',
      solutionFormula: '=SI(B2>=80;"Cumple";"No cumple")',
      initialSheet: { A1: 'Estudiante', B1: 'Asistencia %', C1: 'Resultado', D1: 'Curso', A2: 'María', B2: 92, C2: '', D2: 'Excel' },
      validate: (f: string, v: unknown) => {
        const fn = String(f ?? '').replace(/\s/g, '');
        const ok = /^=(SI|IF)\(B2>=80;"Cumple";"No cumple"\)$/i.test(fn);
        return { ok: ok && String(v) === 'Cumple', feedback: ok && String(v) === 'Cumple' ? '¡Correcto! 92% cumple con la asistencia mínima.' : 'Usa =SI(B2>=80;"Cumple";"No cumple") en C2.' };
      },
    },
  ],
});

const EXCEL_CURRICULUM_4_13: ExcelLessonCurriculum = normalizeLessonExercises('les-excel-4-13', {
  lessonId: 'les-excel-4-13',
  introduction:
    'Cuando una decisión necesita más de dos resultados o depende de varias condiciones al mismo tiempo, puedes ampliar SI con SI anidado, Y() y O(). En esta lección construirás clasificaciones multinivel y reglas con múltiples criterios.',
  keyTakeaways: [
    'SI anidado evalúa condiciones en orden, normalmente de mayor a menor, para devolver una de varias respuestas.',
    'Y(cond1; cond2) devuelve VERDADERO solo cuando todas las condiciones se cumplen.',
    'O(cond1; cond2) devuelve VERDADERO cuando al menos una condición se cumple.',
  ],
  functions: [mod113.functions[0], mod113.functions[1], mod113.functions[2]],
  examples: [mod113.examples[1], mod113.examples[2]],
  exercises: [
    mod113.exercises.find(e => e.id === 'les113-ej5')!,
    mod113.exercises.find(e => e.id === 'les113-ej10')!,
    mod113.exercises.find(e => e.id === 'les113-ej11')!,
    mod113.exercises.find(e => e.id === 'les113-ej14')!,
    {
      id: 'les413-ej5',
      number: 5,
      functionTag: 'SI Anidado',
      title: 'Clasificar temperatura',
      prompt: 'En C2 escribe =SI(B2>=30;"Alta";SI(B2>=20;"Media";"Baja")) para clasificar la temperatura.',
      hint: 'Evalúa primero la condición más alta: B2>=30.',
      targetCell: 'C2',
      solutionFormula: '=SI(B2>=30;"Alta";SI(B2>=20;"Media";"Baja"))',
      initialSheet: { A1: 'Ciudad', B1: 'Temperatura', C1: 'Clasificación', D1: 'Día', A2: 'Santo Domingo', B2: 32, C2: '', D2: 'Lunes' },
      validate: (f: string, v: unknown) => {
        const fn = String(f ?? '').replace(/\s/g, '');
        const ok = /^=(SI|IF)\(B2>=30;"Alta";(SI|IF)\(B2>=20;"Media";"Baja"\)\)$/i.test(fn);
        return { ok: ok && String(v) === 'Alta', feedback: ok && String(v) === 'Alta' ? '¡Correcto! 32 es >= 30, por eso la temperatura es "Alta".' : 'Usa un SI anidado en C2: =SI(B2>=30;"Alta";SI(B2>=20;"Media";"Baja")).' };
      },
    },
    {
      id: 'les413-ej6',
      number: 6,
      functionTag: 'SI + Y()',
      title: 'Validar entrega completa',
      prompt: 'En D2 escribe =SI(Y(B2="Sí";C2="Sí");"Completa";"Incompleta") para validar que pago y documentación estén listos.',
      hint: 'Y() necesita que ambas condiciones sean verdaderas.',
      targetCell: 'D2',
      solutionFormula: '=SI(Y(B2="Sí";C2="Sí");"Completa";"Incompleta")',
      initialSheet: { A1: 'Cliente', B1: 'Pago', C1: 'Documentos', D1: 'Entrega', A2: 'Rosa', B2: 'Sí', C2: 'No', D2: '' },
      validate: (f: string, v: unknown) => {
        const fn = String(f ?? '').replace(/\s/g, '');
        const ok = /^=(SI|IF)\((Y|AND)\(B2="Sí";C2="Sí"\);"Completa";"Incompleta"\)$/i.test(fn);
        return { ok: ok && String(v) === 'Incompleta', feedback: ok && String(v) === 'Incompleta' ? '¡Correcto! Falta documentación, por eso la entrega es "Incompleta".' : 'Usa =SI(Y(B2="Sí";C2="Sí");"Completa";"Incompleta") en D2.' };
      },
    },
    {
      id: 'les413-ej7',
      number: 7,
      functionTag: 'SI + O()',
      title: 'Activar alerta de seguridad',
      prompt: 'En D2 escribe =SI(O(B2="Crítico";C2<5);"Alerta";"Normal") para activar alerta por nivel crítico o stock bajo.',
      hint: 'O() devuelve VERDADERO si al menos una condición se cumple.',
      targetCell: 'D2',
      solutionFormula: '=SI(O(B2="Crítico";C2<5);"Alerta";"Normal")',
      initialSheet: { A1: 'Producto', B1: 'Nivel', C1: 'Stock', D1: 'Estado', A2: 'Extintor', B2: 'Normal', C2: 2, D2: '' },
      validate: (f: string, v: unknown) => {
        const fn = String(f ?? '').replace(/\s/g, '');
        const ok = /^=(SI|IF)\((O|OR)\(B2="Crítico";C2<5\);"Alerta";"Normal"\)$/i.test(fn);
        return { ok: ok && String(v) === 'Alerta', feedback: ok && String(v) === 'Alerta' ? '¡Correcto! El stock es menor que 5, así que se activa "Alerta".' : 'Usa =SI(O(B2="Crítico";C2<5);"Alerta";"Normal") en D2.' };
      },
    },
    {
      id: 'les413-ej8',
      number: 8,
      functionTag: 'SI Anidado',
      title: 'Asignar tarifa por edad',
      prompt: 'En C2 escribe =SI(B2<12;"Infantil";SI(B2<60;"Adulto";"Senior")) para asignar la tarifa por edad.',
      hint: 'Ordena las condiciones de menor a mayor edad o por rangos claros.',
      targetCell: 'C2',
      solutionFormula: '=SI(B2<12;"Infantil";SI(B2<60;"Adulto";"Senior"))',
      initialSheet: { A1: 'Visitante', B1: 'Edad', C1: 'Tarifa', D1: 'Día', A2: 'Luis', B2: 65, C2: '', D2: 'Sábado' },
      validate: (f: string, v: unknown) => {
        const fn = String(f ?? '').replace(/\s/g, '');
        const ok = /^=(SI|IF)\(B2<12;"Infantil";(SI|IF)\(B2<60;"Adulto";"Senior"\)\)$/i.test(fn);
        return { ok: ok && String(v) === 'Senior', feedback: ok && String(v) === 'Senior' ? '¡Correcto! 65 años corresponde a tarifa "Senior".' : 'Usa =SI(B2<12;"Infantil";SI(B2<60;"Adulto";"Senior")) en C2.' };
      },
    },
    {
      id: 'les413-ej9',
      number: 9,
      functionTag: 'SI + Y()',
      title: 'Aprobar envío gratis',
      prompt: 'En D2 escribe =SI(Y(B2>=100;C2="Local");"Gratis";"Con costo") para dar envío gratis solo si el monto es >= 100 y la zona es Local.',
      hint: 'Ambas condiciones deben cumplirse dentro de Y().',
      targetCell: 'D2',
      solutionFormula: '=SI(Y(B2>=100;C2="Local");"Gratis";"Con costo")',
      initialSheet: { A1: 'Orden', B1: 'Monto', C1: 'Zona', D1: 'Envío', A2: 'O-10', B2: 120, C2: 'Local', D2: '' },
      validate: (f: string, v: unknown) => {
        const fn = String(f ?? '').replace(/\s/g, '');
        const ok = /^=(SI|IF)\((Y|AND)\(B2>=100;C2="Local"\);"Gratis";"Con costo"\)$/i.test(fn);
        return { ok: ok && String(v) === 'Gratis', feedback: ok && String(v) === 'Gratis' ? '¡Correcto! El monto y la zona cumplen la condición: envío "Gratis".' : 'Usa =SI(Y(B2>=100;C2="Local");"Gratis";"Con costo") en D2.' };
      },
    },
    {
      id: 'les413-ej10',
      number: 10,
      functionTag: 'SI + O()',
      title: 'Priorizar atención',
      prompt: 'En D2 escribe =SI(O(B2="Urgente";C2>48);"Prioritaria";"Normal") para priorizar por urgencia o espera mayor a 48 horas.',
      hint: 'Basta con que una de las dos condiciones se cumpla.',
      targetCell: 'D2',
      solutionFormula: '=SI(O(B2="Urgente";C2>48);"Prioritaria";"Normal")',
      initialSheet: { A1: 'Ticket', B1: 'Prioridad', C1: 'Horas espera', D1: 'Atención', A2: 'T-55', B2: 'Media', C2: 72, D2: '' },
      validate: (f: string, v: unknown) => {
        const fn = String(f ?? '').replace(/\s/g, '');
        const ok = /^=(SI|IF)\((O|OR)\(B2="Urgente";C2>48\);"Prioritaria";"Normal"\)$/i.test(fn);
        return { ok: ok && String(v) === 'Prioritaria', feedback: ok && String(v) === 'Prioritaria' ? '¡Correcto! La espera supera 48 horas, por eso es "Prioritaria".' : 'Usa =SI(O(B2="Urgente";C2>48);"Prioritaria";"Normal") en D2.' };
      },
    },
  ],
});

export const EXCEL_CURRICULUM: Record<string, ExcelLessonCurriculum> = {
  // Módulo 0 (0.0 – 0.7)
  'les-excel-0-0': normalizeLessonExercises('les-excel-0-0', EXCEL_CURRICULUM_MOD0['les-excel-0-0']),
  'les-excel-0-1': normalizeLessonExercises('les-excel-0-1', EXCEL_CURRICULUM_MOD0['les-excel-0-1']),
  'les-excel-0-2': normalizeLessonExercises('les-excel-0-2', EXCEL_CURRICULUM_MOD0['les-excel-0-2']),
  'les-excel-0-3': normalizeLessonExercises('les-excel-0-3', EXCEL_CURRICULUM_MOD0['les-excel-0-3']),
  'les-excel-0-4': normalizeLessonExercises('les-excel-0-4', EXCEL_CURRICULUM_MOD0['les-excel-0-4']),
  'les-excel-0-5': normalizeLessonExercises('les-excel-0-5', EXCEL_CURRICULUM_MOD0['les-excel-0-5']),
  'les-excel-0-6': normalizeLessonExercises('les-excel-0-6', EXCEL_CURRICULUM_MOD0['les-excel-0-6']),
  'les-excel-0-7': normalizeLessonExercises('les-excel-0-7', EXCEL_CURRICULUM_MOD0['les-excel-0-7']),

  // Módulo 1 (1.1 – 1.3)
  'les-excel-1-1': mergeFoundation('les-excel-1-1'),
  'les-excel-1-2': mergeFoundation('les-excel-1-2'),
  'les-excel-1-3': mergeFoundation('les-excel-1-3'),

  // Módulo 2 (2.1 – 2.3)
  'les-excel-2-1': mergeFoundation('les-excel-2-1'),
  'les-excel-2-2': mergeFoundation('les-excel-2-2'),
  'les-excel-2-3': mergeFoundation('les-excel-2-3'),

  // Módulo 3 (3.1 – 3.5)
  'les-excel-3-1': mergeFoundation('les-excel-3-1'),
  'les-excel-3-2': mergeFoundation('les-excel-3-2'),
  'les-excel-3-3': mergeFoundation('les-excel-3-3'),
  'les-excel-3-4': mergeFoundation('les-excel-3-4'),
  'les-excel-3-5': normalizeLessonExercises('les-excel-3-5', EXCEL_CURRICULUM_MOD0['les-excel-0-4']),


  // Módulo 4: Funciones Matemáticas, Estadísticas y Lógicas (4.1 – 4.13)
  'les-excel-4-1': normalizeLessonExercises('les-excel-4-1', EXCEL_CURRICULUM_MOD1A['les-excel-1-1']),
  'les-excel-4-2': normalizeLessonExercises('les-excel-4-2', EXCEL_CURRICULUM_MOD1B['les-excel-1-8']),
  'les-excel-4-3': EXCEL_CURRICULUM_4_3,
  'les-excel-4-4': normalizeLessonExercises('les-excel-4-4', EXCEL_CURRICULUM_MOD1A['les-excel-1-2']),
  'les-excel-4-5': normalizeLessonExercises('les-excel-4-5', EXCEL_CURRICULUM_MOD1A['les-excel-1-3']),
  'les-excel-4-6': normalizeLessonExercises('les-excel-4-6', EXCEL_CURRICULUM_MOD1A['les-excel-1-4']),
  'les-excel-4-7': normalizeLessonExercises('les-excel-4-7', EXCEL_CURRICULUM_MOD1A['les-excel-1-5']),
  'les-excel-4-8': normalizeLessonExercises('les-excel-4-8', EXCEL_CURRICULUM_MOD1A['les-excel-1-6']),
  'les-excel-4-9': normalizeLessonExercises('les-excel-4-9', EXCEL_CURRICULUM_MOD1B['les-excel-1-7']),
  'les-excel-4-10': normalizeLessonExercises('les-excel-4-10', EXCEL_CURRICULUM_MOD1B['les-excel-1-12']),
  'les-excel-4-11': normalizeLessonExercises('les-excel-4-11', EXCEL_CURRICULUM_MOD1B['les-excel-1-11']),
  'les-excel-4-12': EXCEL_CURRICULUM_4_12,
  'les-excel-4-13': EXCEL_CURRICULUM_4_13,
};
