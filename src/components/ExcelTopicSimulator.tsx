import React, { Suspense, lazy, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Dices,
  Filter,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { ExcelScreenInterfaceViewer } from './ExcelScreenInterfaceViewer';
import { ExcelGridBasicsViewer } from './ExcelGridBasicsViewer';
import { ExcelF4ReferenceViewer } from './ExcelF4ReferenceViewer';
import { IntermediateTopicSim, type IntermediateSimKind } from './IntermediateTopicSim';
import { OperadoresComparacionSimulator } from './OperadoresComparacionSimulator';

const ExcelSimulator3D = lazy(() =>
  import('./ExcelSimulator3D').then((m) => ({ default: m.ExcelSimulator3D }))
);

export type TopicSimulatorKind =
  | 'grid-basics'
  | 'screen-9'
  | 'function-anatomy'
  | 'f4-references'
  | 'external-sheets'
  | 'operators-hierarchy'
  | 'function-wizard'
  | 'error-diagnostics'
  | 'nested-functions'
  | 'data-fill-handle'
  | 'number-formatting'
  | 'math-basic'
  | 'rounding'
  | 'int-mod-power'
  | 'central-tendency'
  | 'extremes-ifs'
  | 'counting-basic'
  | 'conditional-calc'
  | 'subtotals-filter'
  | 'random-gen'
  | 'if-logic'
  | IntermediateSimKind;

export interface TopicSimulatorMeta {
  kind: TopicSimulatorKind;
  shortBadge: string;
  topicLabel: string;
  subtitle: string;
}

/** Simuladores específicos del curso Excel Intermedio (módulos 1 al 8). */
const INTERMEDIATE_MODULES: Record<
  number,
  { kind: IntermediateSimKind; topic: string; badges: string[]; subtitle: string }
> = {
  1: {
    kind: 'logic-advanced', topic: 'Funciones lógicas avanzadas',
    badges: ['SI', 'Y / O / NO', 'SI anidado', 'SI.CONJUNTO', 'SI.ERROR', 'CAMBIAR', 'SI + CONTAR.SI', 'Caso: calificaciones'],
    subtitle: 'Cambia notas, ventas y asistencia para evaluar SI, Y/O, IFS y SI.ERROR en vivo.',
  },
  2: {
    kind: 'text-functions', topic: 'Funciones de texto',
    badges: ['IZQUIERDA / DERECHA', 'LARGO / HALLAR', 'MAYUSC / NOMPROPIO', 'LIMPIAR / SUSTITUIR', 'UNIRCADENAS', 'TEXTO', 'Texto en columnas', 'Caso: limpieza'],
    subtitle: 'Edita un texto y compara IZQUIERDA, DERECHA, EXTRAE, LARGO, NOMPROPIO y UNIRCADENAS.',
  },
  3: {
    kind: 'date-functions', topic: 'Fechas y horas',
    badges: ['Serie de fecha', 'HOY / FECHA', 'DIASEM', 'FIN.MES', 'DIAS.LAB', 'SIFECHA', 'Horas', 'Caso: vencimientos'],
    subtitle: 'Observa el número de serie, FIN.MES, DIAS.LAB y la edad calculada con SIFECHA.',
  },
  4: {
    kind: 'lookup-functions', topic: 'Búsqueda y referencia',
    badges: ['BUSCARV', 'BUSCARH', 'Exacta / aprox.', 'INDICE', 'INDICE + COINCIDIR', 'BUSCARX', 'ELEGIR / DESREF', 'Varios criterios', 'Caso: facturación'],
    subtitle: 'Busca un código en el catálogo y compara BUSCARV, INDICE+COINCIDIR y BUSCARX.',
  },
  5: {
    kind: 'table-data', topic: 'Tablas y gestión de datos',
    badges: ['Ctrl + T', 'Referencias', 'Ordenar', 'Filtros', 'Slicers', 'Duplicados', 'Validación', 'Listas dependientes', 'Caso: inventario'],
    subtitle: 'Activa la tabla, aplica filtros y quita duplicados para ver cómo cambian las filas.',
  },
  6: {
    kind: 'conditional-format', topic: 'Formato condicional y protección',
    badges: ['Resaltar', 'Barras / iconos', 'Fórmulas', 'Prioridad de reglas', 'Vencidos', 'Proteger', 'Ocultar fórmulas', 'Caso: semáforo'],
    subtitle: 'Prueba reglas de resaltado, barras de datos, semáforo y fórmulas personalizadas.',
  },
  7: {
    kind: 'pivot-chart', topic: 'Tablas dinámicas y gráficos',
    badges: ['Qué es un pivote', 'Crear pivote', 'Agrupar', 'Campos calculados', 'Segmentación', 'Gráfico dinámico', 'Gráficos básicos', 'Combinados', 'Caso: reporte'],
    subtitle: 'Cambia las filas y los valores del pivote para ver el resumen agrupado al instante.',
  },
  8: {
    kind: 'productivity-final', topic: 'Productividad y proyecto final',
    badges: ['Atajos', 'Nombres definidos', 'Vistas', 'Vincular hojas', 'Impresión', 'Auditoría', 'Hipótesis', 'Power Query / Macros', 'Proyecto final', 'Evaluación'],
    subtitle: 'Explora atajos y calcula con Buscar objetivo el ajuste necesario para tu meta.',
  },
};

const INTERMEDIATE_KINDS = new Set<IntermediateSimKind>(
  Object.values(INTERMEDIATE_MODULES).map((module) => module.kind)
);

export function getTopicSimulatorMeta(lessonId?: string | null): TopicSimulatorMeta {
  const intermediate = lessonId?.match(/^m([1-8])-l(\d+)$/);
  if (intermediate) {
    const moduleNumber = Number(intermediate[1]);
    const lessonNumber = Number(intermediate[2]);
    const config = INTERMEDIATE_MODULES[moduleNumber];
    const badge = config.badges[Math.min(Math.max(lessonNumber - 1, 0), config.badges.length - 1)];
    return {
      kind: config.kind,
      shortBadge: badge,
      topicLabel: `Simulador: ${badge} · ${config.topic}`,
      subtitle: config.subtitle,
    };
  }

  switch (lessonId) {
    case 'les-excel-0-0':
      return {
        kind: 'grid-basics',
        shortBadge: 'Cuadrícula A1',
        topicLabel: 'Simulador: Columnas, Filas y Celdas',
        subtitle: 'Haz clic en las celdas de la cuadrícula para inspeccionar coordenadas, filas, columnas y rangos.',
      };
    case 'les-excel-1-1':
      return {
        kind: 'screen-9',
        shortBadge: '9 Piezas',
        topicLabel: 'Simulador: Las 9 Piezas de la Pantalla',
        subtitle: 'Explora la anatomía interactiva de la ventana de Microsoft Excel.',
      };
    case 'les-excel-1-2':
    case 'les-excel-1-3':
      return {
        kind: 'grid-basics',
        shortBadge: 'Rangos & Hojas',
        topicLabel: 'Simulador: Navegación, Rangos y Pestañas',
        subtitle: 'Practica seleccionar rangos como A1:D4, renombrar pestañas a «Práctica» y moverte por la hoja.',
      };
    case 'les-excel-0-1':
      return {
        kind: 'function-anatomy',
        shortBadge: 'Anatomía =fx()',
        topicLabel: 'Simulador: Anatomía de una Función',
        subtitle: 'Activa o desactiva el signo =, cambia la función y comprueba argumentos obligatorios y [opcionales].',
      };
    case 'les-excel-0-2':
    case 'les-excel-3-2':
    case 'les-excel-3-4':
      return {
        kind: 'f4-references',
        shortBadge: 'F4 & ITBIS 18%',
        topicLabel: 'Simulador: Referencias F4 e ITBIS Reactivo',
        subtitle: 'Alterna entre A1, $A$1, A$1 y $A1 y observa cómo el candado $ evita errores al arrastrar.',
      };
    case 'les-excel-0-3':
      return {
        kind: 'external-sheets',
        shortBadge: 'Hojas ! y [...]',
        topicLabel: 'Simulador: Referencias a Hojas y Libros Externos',
        subtitle: 'Vincula celdas desde otras pestañas y libros externos observando cuándo van comillas simples.',
      };
    case 'les-excel-0-4':
    case 'les-excel-3-1':
    case 'les-excel-3-5':
      return {
        kind: 'operators-hierarchy',
        shortBadge: 'Operadores',
        topicLabel: 'Simulador: Operadores y Jerarquía Matemática',
        subtitle: 'Prueba operadores aritméticos, de comparación, concatenación (&), referencia y orden PEMDAS.',
      };
    case 'les-excel-0-5':
      return {
        kind: 'function-wizard',
        shortBadge: 'Asistente fx',
        topicLabel: 'Simulador: Autocompletado (Tab) y Asistente fx',
        subtitle: 'Escribe prefijos como =PRO o =SU, autocompleta con Tab y revisa los argumentos en vivo.',
      };
    case 'les-excel-0-6':
    case 'les-excel-3-3':
      return {
        kind: 'error-diagnostics',
        shortBadge: 'Errores #!',
        topicLabel: 'Simulador: Diagnóstico y Corrección de Errores',
        subtitle: 'Inspecciona #¡DIV/0!, #¡VALOR!, #¿NOMBRE?, #REF!, #N/A y ##### y aplica la reparación paso a paso.',
      };
    case 'les-excel-0-7':
      return {
        kind: 'nested-functions',
        shortBadge: 'Anidamiento',
        topicLabel: 'Simulador: Anidar Funciones (De Adentro Hacia Afuera)',
        subtitle: 'Visualiza los pares de paréntesis por color y evalúa la función interna antes que la externa.',
      };
    case 'les-excel-2-1':
      return {
        kind: 'data-fill-handle',
        shortBadge: 'Datos & Relleno',
        topicLabel: 'Simulador: Tipos de Datos y Controlador de Relleno',
        subtitle: 'Comprueba la alineación automática (texto vs número) y arrastra series como Lunes o Enero.',
      };
    case 'les-excel-2-2':
    case 'les-excel-2-3':
      return {
        kind: 'number-formatting',
        shortBadge: 'Formato $ / %',
        topicLabel: 'Simulador: Pestaña Inicio y Formatos de Número',
        subtitle: 'Aplica Negrita, alineación, Moneda ($) y Porcentaje (0.15 → 15%) sin alterar el valor guardado.',
      };
    case 'les-excel-4-1':
      return {
        kind: 'math-basic',
        shortBadge: 'SUMA / RESTA',
        topicLabel: 'Simulador: SUMA, RESTA (-) y PRODUCTO',
        subtitle: 'Edita las celdas del rango y comprueba por qué en Excel se suman referencias de celda.',
      };
    case 'les-excel-4-2':
      return {
        kind: 'rounding',
        shortBadge: 'REDONDEAR',
        topicLabel: 'Simulador: REDONDEAR, REDONDEAR.MAS y REDONDEAR.MENOS',
        subtitle: 'Ajusta el número y los decimales para comparar los tres modos de redondeo en vivo.',
      };
    case 'les-excel-4-3':
      return {
        kind: 'int-mod-power',
        shortBadge: 'ENTERO / RAIZ',
        topicLabel: 'Simulador: ENTERO, TRUNCAR, RESIDUO, POTENCIA, RAIZ y ABS',
        subtitle: 'Compara ENTERO vs TRUNCAR en negativos y calcula resto, potencias, raíces y valor absoluto.',
      };
    case 'les-excel-4-4':
      return {
        kind: 'central-tendency',
        shortBadge: 'PROMEDIO / MODA',
        topicLabel: 'Simulador: PROMEDIO, MEDIANA y MODA',
        subtitle: 'Modifica un valor extremo y observa cómo cambia el promedio frente a la mediana.',
      };
    case 'les-excel-4-5':
      return {
        kind: 'extremes-ifs',
        shortBadge: 'MAX / MINIFS',
        topicLabel: 'Simulador: MAX, MIN, MAX.SI.CONJUNTO y MIN.SI.CONJUNTO',
        subtitle: 'Filtra por categoría o umbral y observa cómo cambian los extremos condicionados.',
      };
    case 'les-excel-4-6':
      return {
        kind: 'counting-basic',
        shortBadge: 'CONTAR / BLANCO',
        topicLabel: 'Simulador: CONTAR, CONTARA y CONTAR.BLANCO',
        subtitle: 'Cambia cada celda entre número, cero, texto o vacía para ver qué cuenta cada función.',
      };
    case 'les-excel-4-7':
    case 'les-excel-4-8':
    case 'les-excel-4-9':
      return {
        kind: 'conditional-calc',
        shortBadge:
          lessonId === 'les-excel-4-7'
            ? 'CONTAR.SI'
            : lessonId === 'les-excel-4-8'
              ? 'SUMAR.SI'
              : 'PROMEDIO.SI',
        topicLabel:
          lessonId === 'les-excel-4-7'
            ? 'Simulador: CONTAR.SI y CONTAR.SI.CONJUNTO'
            : lessonId === 'les-excel-4-8'
              ? 'Simulador: SUMAR.SI y SUMAR.SI.CONJUNTO'
              : 'Simulador: PROMEDIO.SI y PROMEDIO.SI.CONJUNTO',
        subtitle: 'Elige 1 o 2 criterios para resaltar las filas coincidentes y verificar la sintaxis exacta.',
      };
    case 'les-excel-4-10':
      return {
        kind: 'subtotals-filter',
        shortBadge: 'SUBTOTALES',
        topicLabel: 'Simulador: SUBTOTALES vs SUMA con AutoFiltro',
        subtitle: 'Activa filtros por región para comprobar que SUBTOTALES ignora filas ocultas y SUMA no.',
      };
    case 'les-excel-4-11':
      return {
        kind: 'random-gen',
        shortBadge: 'ALEATORIO',
        topicLabel: 'Simulador: ALEATORIO y ALEATORIO.ENTRE',
        subtitle: 'Pulsa Recalcular (F9) para generar decimales [0, 1) y enteros entre inferior y superior.',
      };
    case 'les-excel-4-12':
    case 'les-excel-4-13':
    case 'les-excel-1-13':
      return {
        kind: 'if-logic',
        shortBadge: '=SI() 3D',
        topicLabel: 'Simulador 3D: =SI(), Anidado, Y() y O()',
        subtitle: 'Evalúa condiciones lógicas en vivo y explora las compuertas de decisión en 3D.',
      };
    default:
      return {
        kind: 'function-anatomy',
        shortBadge: 'Simulador',
        topicLabel: 'Simulador Interactivo del Tema',
        subtitle: 'Experimenta en vivo con los parámetros clave de esta lección.',
      };
  }
}

interface ExcelTopicSimulatorProps {
  lessonId: string;
  onInteract?: () => void;
}

/* ------------------------------------------------------------------ */
/*  0.1 Anatomía de una función                                       */
/* ------------------------------------------------------------------ */
const FunctionAnatomySim: React.FC = () => {
  const [hasEquals, setHasEquals] = useState(true);
  const [fnName, setFnName] = useState<'SUMA' | 'PROMEDIO' | 'MAX' | 'MIN' | 'CONTAR'>('SUMA');
  const [sep, setSep] = useState<';' | ','>(';');
  const [includeExtraArg, setIncludeExtraArg] = useState(false);
  const [extraNum, setExtraNum] = useState(25);
  const [selectedPart, setSelectedPart] = useState<'eq' | 'name' | 'req' | 'opt'>('name');
  const [vals, setVals] = useState([40, 85, 55, 70]);

  const computed = useMemo(() => {
    const all = includeExtraArg ? [...vals, extraNum] : vals;
    if (fnName === 'SUMA') return all.reduce((a, b) => a + b, 0);
    if (fnName === 'PROMEDIO') return Number((all.reduce((a, b) => a + b, 0) / all.length).toFixed(2));
    if (fnName === 'MAX') return Math.max(...all);
    if (fnName === 'MIN') return Math.min(...all);
    return all.length;
  }, [vals, fnName, includeExtraArg, extraNum]);

  const formulaString = `${hasEquals ? '=' : ''}${fnName}(B2:B5${includeExtraArg ? `${sep} ${extraNum}` : ''})`;

  const partDescriptions: Record<typeof selectedPart, string> = {
    eq: 'Signo igual (=): Le indica a Excel que debe CALCULAR. Si falta, Excel guarda la fórmula como texto literal sin calcular nada.',
    name: `Nombre oficial (${fnName}): Identifica la operación exacta. Puede escribirse en minúsculas y Excel lo pasa a mayúsculas al confirmar.`,
    req: 'Argumento obligatorio (B2:B5): Rango de celdas que necesita la función. Nunca lleva corchetes.',
    opt: `[número2] opcional (${sep} ${extraNum}): Los argumentos entre corchetes en la ayuda de Excel pueden omitirse o agregarse separados por "${sep}".`,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => setHasEquals((v) => !v)}
          className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-semibold text-left transition-colors ${
            hasEquals
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
              : 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
          }`}
        >
          1. Signo (=): {hasEquals ? 'Activado (Calcula)' : 'Desactivado (Solo texto)'}
        </button>

        <label className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs flex flex-col gap-1">
          <span className="font-semibold text-slate-600 dark:text-slate-300">2. Función</span>
          <select
            value={fnName}
            onChange={(e) => setFnName(e.target.value as typeof fnName)}
            className="bg-transparent font-mono font-bold text-slate-900 dark:text-white text-base sm:text-xs focus:outline-none"
          >
            <option value="SUMA">SUMA</option>
            <option value="PROMEDIO">PROMEDIO</option>
            <option value="MAX">MAX</option>
            <option value="MIN">MIN</option>
            <option value="CONTAR">CONTAR</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => setSep((s) => (s === ';' ? ',' : ';'))}
          className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-left text-slate-800 dark:text-slate-100 hover:border-blue-500"
        >
          3. Separador regional: <span className="font-mono text-blue-600 dark:text-cyan-300">{sep}</span>
        </button>

        <button
          type="button"
          onClick={() => setIncludeExtraArg((v) => !v)}
          className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-semibold text-left transition-colors ${
            includeExtraArg
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
          }`}
        >
          4. [Arg. opcional]: {includeExtraArg ? 'Incluido' : 'Omitido'}
        </button>
      </div>

      {/* Anatomía clicable */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-sm sm:text-base break-words">
          <button
            type="button"
            onClick={() => setSelectedPart('eq')}
            className={`px-2 py-1 rounded-md border min-h-[36px] ${
              hasEquals
                ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                : 'border-red-500/60 bg-red-500/20 text-red-300 line-through'
            }`}
          >
            {hasEquals ? '=' : '(sin =)'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedPart('name')}
            className="px-2 py-1 rounded-md border border-cyan-500/60 bg-cyan-500/20 text-cyan-200 font-bold min-h-[36px]"
          >
            {fnName}
          </button>
          <span className="text-slate-400">(</span>
          <button
            type="button"
            onClick={() => setSelectedPart('req')}
            className="px-2 py-1 rounded-md border border-blue-500/60 bg-blue-500/20 text-blue-200 min-h-[36px]"
          >
            B2:B5
          </button>
          {includeExtraArg && (
            <>
              <span className="text-amber-300 font-bold">{sep}</span>
              <button
                type="button"
                onClick={() => setSelectedPart('opt')}
                className="px-2 py-1 rounded-md border border-amber-500/60 bg-amber-500/20 text-amber-200 min-h-[36px]"
              >
                {extraNum}
              </button>
            </>
          )}
          <span className="text-slate-400">)</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{partDescriptions[selectedPart]}</p>
      </div>

      {/* Mini hoja reactiva */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4 items-start">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
          <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
            Edita B2:B5 para probar el recálculo en vivo
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {vals.map((val, i) => (
              <div key={i} className="grid grid-cols-[64px_1fr] items-center text-xs">
                <span className="px-3 py-2 font-mono font-bold bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                  B{i + 2}
                </span>
                <input
                  type="number"
                  value={val}
                  onChange={(e) => {
                    const next = [...vals];
                    next[i] = Number(e.target.value) || 0;
                    setVals(next);
                  }}
                  className="px-3 py-2 bg-transparent text-slate-900 dark:text-slate-100 font-mono text-base sm:text-xs focus:outline-none focus:bg-blue-50/40 dark:focus:bg-blue-950/30"
                />
              </div>
            ))}
            {includeExtraArg && (
              <div className="grid grid-cols-[64px_1fr] items-center text-xs bg-amber-50/50 dark:bg-amber-950/20">
                <span className="px-3 py-2 font-mono font-bold text-amber-800 dark:text-amber-300 border-r border-slate-200 dark:border-slate-800">
                  Extra
                </span>
                <input
                  type="number"
                  value={extraNum}
                  onChange={(e) => setExtraNum(Number(e.target.value) || 0)}
                  className="px-3 py-2 bg-transparent text-slate-900 dark:text-slate-100 font-mono text-base sm:text-xs focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 p-4 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Celda B6 (Resultado en Excel)
          </div>
          <div className="font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-all bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
            {formulaString}
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              hasEquals ? 'text-[#107C41] dark:text-emerald-400' : 'text-amber-600 dark:text-amber-300 text-sm break-all'
            }`}
          >
            {hasEquals ? computed : formulaString}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {hasEquals
              ? 'Como empieza con =, Excel evalúa la función y recalcula automáticamente.'
              : 'Sin = inicial, Excel lo interpreta como texto plano alineado a la izquierda.'}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  0.3 Referencias a hojas y libros externos                         */
/* ------------------------------------------------------------------ */
const ExternalSheetsSim: React.FC = () => {
  const [sourceSheet, setSourceSheet] = useState<'Ventas' | 'Ventas 2026' | 'external'>('Ventas');
  const [ventasB2, setVentasB2] = useState(1450);
  const [ventas2026B5, setVentas2026B5] = useState(3200);
  const [extB4, setExtB4] = useState(5800);

  const generatedFormula =
    sourceSheet === 'Ventas'
      ? '=Ventas!B2'
      : sourceSheet === 'Ventas 2026'
        ? "='Ventas 2026'!B5"
        : "='[Presupuesto.xlsx]Resumen'!$B$4";

  const activeValue =
    sourceSheet === 'Ventas' ? ventasB2 : sourceSheet === 'Ventas 2026' ? ventas2026B5 : extB4;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSourceSheet('Ventas')}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors ${
            sourceSheet === 'Ventas'
              ? 'bg-[#107C41] text-white border-[#107C41]'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
          }`}
        >
          Pestaña simple: Ventas!B2
        </button>
        <button
          type="button"
          onClick={() => setSourceSheet('Ventas 2026')}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors ${
            sourceSheet === 'Ventas 2026'
              ? 'bg-[#107C41] text-white border-[#107C41]'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
          }`}
        >
          Con espacios: &apos;Ventas 2026&apos;!B5
        </button>
        <button
          type="button"
          onClick={() => setSourceSheet('external')}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors ${
            sourceSheet === 'external'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
          }`}
        >
          Libro externo: [Presupuesto.xlsx]
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
            1. Origen de los datos ({sourceSheet === 'external' ? 'Presupuesto.xlsx · Resumen' : `Mismo libro · ${sourceSheet}`})
          </div>

          {sourceSheet === 'Ventas' && (
            <label className="block text-xs space-y-1">
              <span className="text-slate-600 dark:text-slate-300 font-mono">Hoja Ventas · Celda B2</span>
              <input
                type="number"
                value={ventasB2}
                onChange={(e) => setVentasB2(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-mono text-base sm:text-sm text-slate-900 dark:text-white"
              />
            </label>
          )}
          {sourceSheet === 'Ventas 2026' && (
            <label className="block text-xs space-y-1">
              <span className="text-slate-600 dark:text-slate-300 font-mono">Hoja &quot;Ventas 2026&quot; · Celda B5</span>
              <input
                type="number"
                value={ventas2026B5}
                onChange={(e) => setVentas2026B5(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-mono text-base sm:text-sm text-slate-900 dark:text-white"
              />
            </label>
          )}
          {sourceSheet === 'external' && (
            <label className="block text-xs space-y-1">
              <span className="text-slate-600 dark:text-slate-300 font-mono">[Presupuesto.xlsx]Resumen · $B$4</span>
              <input
                type="number"
                value={extB4}
                onChange={(e) => setExtB4(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-mono text-base sm:text-sm text-slate-900 dark:text-white"
              />
            </label>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {sourceSheet === 'Ventas' &&
              'Cuando el nombre de la pestaña no tiene espacios ni símbolos especiales, se escribe directo antes del signo !.'}
            {sourceSheet === 'Ventas 2026' &&
              'Como el nombre contiene un espacio, Excel obliga a rodearlo con comillas simples (\'Ventas 2026\') antes del signo !.'}
            {sourceSheet === 'external' &&
              'Para otro archivo de Excel, el nombre del libro va entre corchetes [Presupuesto.xlsx] seguido de la hoja y !.'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 p-4 space-y-3 text-slate-100">
          <div className="text-xs font-bold text-emerald-400">
            2. Hoja destino: Resumen · Celda C2
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-sm text-cyan-300 whitespace-pre-wrap break-all">
            {generatedFormula}
          </div>
          <div className="flex items-center justify-between border-t border-slate-800 pt-3">
            <span className="text-xs text-slate-400">Valor enlazado en vivo:</span>
            <span className="text-2xl font-mono font-bold text-emerald-400">${activeValue.toLocaleString('es-ES')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  0.4 / 3.1 / 3.5 Operadores y Jerarquía de Evaluación              */
/* ------------------------------------------------------------------ */
const OperatorsHierarchySim: React.FC = () => {
  const [group, setGroup] = useState<'jerarquia' | 'aritmeticos' | 'comparacion' | 'concat' | 'referencia'>('jerarquia');
  const [a1, setA1] = useState(2);
  const [b1, setB1] = useState(3);
  const [c1, setC1] = useState(4);
  const [textA, setTextA] = useState('Juan');
  const [textB, setTextB] = useState('Pérez');

  const noParens = a1 + b1 * Math.pow(c1, 2);
  const withParens = Math.pow((a1 + b1) * c1, 2);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'jerarquia', label: 'Jerarquía () ^ * / + -' },
          { id: 'aritmeticos', label: 'Aritméticos (+ - * / ^ %)' },
          { id: 'comparacion', label: 'Comparación (= > < <>)' },
          { id: 'concat', label: 'Concatenación (&)' },
          { id: 'referencia', label: 'Referencia (: , !)' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setGroup(item.id as typeof group)}
            className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
              group === item.id
                ? 'bg-[#107C41] text-white border-[#107C41]'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {(group === 'jerarquia' || group === 'aritmeticos' || group === 'comparacion') && (
        <div className="grid grid-cols-3 gap-2.5">
          <label className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs">
            <span className="font-mono font-bold text-slate-500 block">A1</span>
            <input
              type="number"
              value={a1}
              onChange={(e) => setA1(Number(e.target.value) || 0)}
              className="mt-1 w-full bg-transparent font-mono font-bold text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none"
            />
          </label>
          <label className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs">
            <span className="font-mono font-bold text-slate-500 block">B1</span>
            <input
              type="number"
              value={b1}
              onChange={(e) => setB1(Number(e.target.value) || 0)}
              className="mt-1 w-full bg-transparent font-mono font-bold text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none"
            />
          </label>
          <label className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs">
            <span className="font-mono font-bold text-slate-500 block">C1</span>
            <input
              type="number"
              value={c1}
              onChange={(e) => setC1(Number(e.target.value) || 0)}
              className="mt-1 w-full bg-transparent font-mono font-bold text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none"
            />
          </label>
        </div>
      )}

      {group === 'jerarquia' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 p-4 space-y-2 text-slate-100">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">
              Sin paréntesis: =A1+B1*C1^2
            </span>
            <p className="font-mono text-xs text-slate-300">
              1º Potencia: {c1}^2 = {Math.pow(c1, 2)}<br />
              2º Multiplicación: {b1} * {Math.pow(c1, 2)} = {b1 * Math.pow(c1, 2)}<br />
              3º Suma: {a1} + {b1 * Math.pow(c1, 2)}
            </p>
            <div className="text-xl font-mono font-bold text-emerald-400">Resultado: {noParens}</div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 p-4 space-y-2 text-slate-100">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300">
              Con paréntesis: =((A1+B1)*C1)^2
            </span>
            <p className="font-mono text-xs text-slate-300">
              1º Paréntesis interno: ({a1}+{b1}) = {a1 + b1}<br />
              2º Segundo paréntesis: {a1 + b1} * {c1} = {(a1 + b1) * c1}<br />
              3º Potencia: {(a1 + b1) * c1}^2
            </p>
            <div className="text-xl font-mono font-bold text-cyan-300">Resultado: {withParens}</div>
          </div>
        </div>
      )}

      {group === 'aritmeticos' && (
        <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          {[
            { op: '+', name: 'Suma', expr: `=A1+B1`, res: a1 + b1 },
            { op: '-', name: 'Resta', expr: `=A1-B1`, res: a1 - b1 },
            { op: '*', name: 'Multiplicación', expr: `=A1*B1`, res: a1 * b1 },
            { op: '/', name: 'División', expr: `=A1/B1`, res: b1 === 0 ? '#¡DIV/0!' : Number((a1 / b1).toFixed(3)) },
            { op: '^', name: 'Potencia', expr: `=A1^B1`, res: Math.pow(a1, b1) },
            { op: '%', name: 'Porcentaje', expr: `=25%`, res: 0.25 },
          ].map((row) => (
            <div key={row.op} className="grid grid-cols-[56px_1fr_auto] items-center px-3 py-2.5 text-xs gap-2">
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{row.op} {row.name}</span>
              <span className="font-mono text-slate-600 dark:text-slate-300">{row.expr}</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{String(row.res)}</span>
            </div>
          ))}
        </div>
      )}

      {group === 'comparacion' && (
        <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          {[
            { expr: `=A1=B1`, ok: a1 === b1, desc: 'Igual a' },
            { expr: `=A1>B1`, ok: a1 > b1, desc: 'Mayor que' },
            { expr: `=A1<B1`, ok: a1 < b1, desc: 'Menor que' },
            { expr: `=A1>=B1`, ok: a1 >= b1, desc: 'Mayor o igual' },
            { expr: `=A1<=B1`, ok: a1 <= b1, desc: 'Menor o igual' },
            { expr: `=A1<>B1`, ok: a1 !== b1, desc: 'Distinto de' },
          ].map((row) => (
            <div key={row.expr} className="grid grid-cols-[1fr_1fr_auto] items-center px-3 py-2.5 text-xs gap-2">
              <span className="font-mono text-slate-800 dark:text-slate-200">{row.expr}</span>
              <span className="text-slate-500 dark:text-slate-400">{row.desc}</span>
              <span className={`font-mono font-bold ${row.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {row.ok ? 'VERDADERO' : 'FALSO'}
              </span>
            </div>
          ))}
        </div>
      )}

      {group === 'concat' && (
        <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs">
              <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">Celda A1 (Nombre)</span>
              <input
                type="text"
                value={textA}
                onChange={(e) => setTextA(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-base sm:text-xs text-slate-900 dark:text-white"
              />
            </label>
            <label className="text-xs">
              <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">Celda B1 (Apellido)</span>
              <input
                type="text"
                value={textB}
                onChange={(e) => setTextB(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-base sm:text-xs text-slate-900 dark:text-white"
              />
            </label>
          </div>
          <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs space-y-1.5 text-slate-200">
            <div><span className="text-cyan-300">=A1&amp;&quot; &quot;&amp;B1</span> → <strong className="text-emerald-400">&quot;{`${textA} ${textB}`}&quot;</strong></div>
            <div><span className="text-cyan-300">=&quot;Total: &quot;&amp;{a1 * 100}</span> → <strong className="text-emerald-400">&quot;Total: {a1 * 100}&quot;</strong></div>
          </div>
        </div>
      )}

      {group === 'referencia' && (
        <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs">
          <div className="p-3 space-y-1">
            <span className="font-mono font-bold text-blue-600 dark:text-cyan-300">: (Dos puntos · Rango continuo)</span>
            <p className="text-slate-600 dark:text-slate-300 font-mono whitespace-pre-wrap break-words">=SUMA(A1:A5) → Incluye A1, A2, A3, A4 y A5.</p>
          </div>
          <div className="p-3 space-y-1">
            <span className="font-mono font-bold text-blue-600 dark:text-cyan-300">; o , (Unión de referencias)</span>
            <p className="text-slate-600 dark:text-slate-300 font-mono whitespace-pre-wrap break-words">=SUMA(A1:B2; D1:D4) → Suma dos bloques separados.</p>
          </div>
          <div className="p-3 space-y-1">
            <span className="font-mono font-bold text-blue-600 dark:text-cyan-300">Espacio (Intersección)</span>
            <p className="text-slate-600 dark:text-slate-300 font-mono whitespace-pre-wrap break-words">=A1:C3 B2:D4 → Toma únicamente las celdas donde cruzan ambos rangos (B2:C3).</p>
          </div>
          <div className="p-3 space-y-1">
            <span className="font-mono font-bold text-blue-600 dark:text-cyan-300">! (Exclamación · Otra pestaña)</span>
            <p className="text-slate-600 dark:text-slate-300 font-mono whitespace-pre-wrap break-words">=Hoja2!A1 → Consulta la celda A1 dentro de la pestaña Hoja2.</p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  0.5 Asistente de funciones (fx) y autocompletado (Tab)            */
/* ------------------------------------------------------------------ */
const WIZARD_FNS = [
  { name: 'PROMEDIO', args: 'número1; [número2]', desc: 'Calcula la media aritmética de los argumentos.', sample: '=PROMEDIO(B2:B5)', preview: 82.5 },
  { name: 'SUMA', args: 'número1; [número2]', desc: 'Suma todos los números de un rango de celdas.', sample: '=SUMA(B2:B5)', preview: 330 },
  { name: 'MAX', args: 'número1; [número2]', desc: 'Devuelve el valor mayor de un conjunto.', sample: '=MAX(B2:B5)', preview: 95 },
  { name: 'CONTAR.SI', args: 'rango; criterio', desc: 'Cuenta las celdas que cumplen una condición.', sample: '=CONTAR.SI(B2:B5;">80")', preview: 2 },
  { name: 'REDONDEAR', args: 'número; núm_decimales', desc: 'Redondea un número al número de decimales especificado.', sample: '=REDONDEAR(82.567;1)', preview: 82.6 },
];

const FunctionWizardSim: React.FC = () => {
  const [typed, setTyped] = useState('=PRO');
  const [selectedFn, setSelectedFn] = useState(WIZARD_FNS[0]);
  const [arg1, setArg1] = useState('80; 95; 70; 85');

  const query = typed.replace(/^=/, '').trim().toUpperCase();
  const matches = useMemo(
    () => WIZARD_FNS.filter((f) => !query || f.name.startsWith(query)),
    [query]
  );

  const parsedNums = arg1
    .split(/[;,\s]+/)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n));

  const liveFxResult = useMemo(() => {
    if (parsedNums.length === 0) return '—';
    if (selectedFn.name === 'PROMEDIO') return (parsedNums.reduce((a, b) => a + b, 0) / parsedNums.length).toFixed(2);
    if (selectedFn.name === 'SUMA') return parsedNums.reduce((a, b) => a + b, 0);
    if (selectedFn.name === 'MAX') return Math.max(...parsedNums);
    if (selectedFn.name === 'CONTAR.SI') return parsedNums.filter((n) => n > 80).length;
    return Number(parsedNums[0].toFixed(1));
  }, [parsedNums, selectedFn.name]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Paso 1: Autocompletado al escribir = y pulsar Tab
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Escribe =PRO, =SU, =MA..."
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-mono text-base sm:text-xs text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={() => {
                const first = matches[0] || WIZARD_FNS[0];
                setSelectedFn(first);
                setTyped(`=${first.name}(`);
              }}
              className="min-h-[44px] px-3 rounded-lg bg-[#107C41] text-white text-xs font-semibold shrink-0"
            >
              Tab ⇥
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
            {matches.map((fn) => (
              <button
                key={fn.name}
                type="button"
                onClick={() => {
                  setSelectedFn(fn);
                  setTyped(`=${fn.name}(`);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/40 ${
                  selectedFn.name === fn.name ? 'bg-blue-50/70 dark:bg-blue-950/30 font-semibold' : ''
                }`}
              >
                <span className="font-mono text-blue-700 dark:text-cyan-300">fx {fn.name}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{fn.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 p-4 space-y-3 text-slate-100">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="font-bold text-cyan-300">Paso 2: Cuadro del Asistente fx — {selectedFn.name}</span>
            <span className="font-mono text-[11px] text-slate-400">({selectedFn.args})</span>
          </div>
          <p className="text-xs text-slate-300">{selectedFn.desc}</p>
          <label className="block text-xs space-y-1">
            <span className="text-slate-400">Argumento 1 (valores separados por ;):</span>
            <input
              type="text"
              value={arg1}
              onChange={(e) => setArg1(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-base sm:text-xs text-white"
            />
          </label>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-400">Resultado preliminar del asistente:</span>
            <span className="text-xl font-mono font-bold text-emerald-400">{String(liveFxResult)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  0.6 / 3.3 Diagnóstico y Corrección de Errores                     */
/* ------------------------------------------------------------------ */
const ERROR_CASES = [
  {
    code: '#¡DIV/0!',
    formula: '=B2/C2',
    brokenData: 'B2 = 1200, C2 = 0 (o vacía)',
    cause: 'Intentaste dividir entre cero o una celda vacía.',
    fixFormula: '=SI.ERROR(B2/C2; 0)',
    fixedOutput: '0 (o al cambiar C2 a 4 → 300)',
  },
  {
    code: '#¡VALOR!',
    formula: '=B2+C2',
    brokenData: 'B2 = 500, C2 = "Pendiente"',
    cause: 'Sumaste o multiplicaste directamente una celda con texto.',
    fixFormula: '=SUMA(B2:C2)',
    fixedOutput: '500 (SUMA ignora textos)',
  },
  {
    code: '#¿NOMBRE?',
    formula: '=SUMA(B2:B5) mal escrito como =SUMMA(B2:B5)',
    brokenData: 'Nombre de función inexistente o texto sin comillas',
    cause: 'Excel no reconoce el nombre de la función o faltan comillas en un texto.',
    fixFormula: '=SUMA(B2:B5)',
    fixedOutput: '340',
  },
  {
    code: '#REF!',
    formula: '=B2+#REF!',
    brokenData: 'La columna C original fue eliminada',
    cause: 'La celda a la que apuntaba la fórmula fue borrada físicamente.',
    fixFormula: '=B2+D2',
    fixedOutput: 'Referencia restaurada',
  },
  {
    code: '#N/A',
    formula: '=BUSCARV("SKU-99"; A2:B10; 2; FALSO)',
    brokenData: '"SKU-99" no existe en la tabla',
    cause: 'La búsqueda exacta no encontró ninguna coincidencia.',
    fixFormula: '=SI.ERROR(BUSCARV("SKU-99"; A2:B10; 2; FALSO); "No encontrado")',
    fixedOutput: '"No encontrado"',
  },
] as const;

const ErrorDiagnosticsSim: React.FC = () => {
  const [idx, setIdx] = useState(0);
  const [repaired, setRepaired] = useState(false);
  const [colWidth, setColWidth] = useState(65);
  const active = ERROR_CASES[idx];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {ERROR_CASES.map((item, i) => (
          <button
            key={item.code}
            type="button"
            onClick={() => {
              setIdx(i);
              setRepaired(false);
            }}
            className={`min-h-[44px] px-3 py-2 rounded-xl border font-mono text-xs font-bold transition-colors ${
              idx === i
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            {item.code}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 p-4 space-y-3 text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold text-rose-400">{repaired ? active.fixedOutput : active.code}</span>
          </div>
          <button
            type="button"
            onClick={() => setRepaired((r) => !r)}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#107C41] hover:bg-emerald-700 text-white text-xs font-semibold"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{repaired ? 'Ver error original' : 'Aplicar solución / SI.ERROR'}</span>
          </button>
        </div>

        <div className="font-mono text-xs bg-slate-900 border border-slate-800 rounded-lg p-3 whitespace-pre-wrap break-words">
          <span className="text-slate-400 block mb-1">Fórmula en celda:</span>
          <span className={repaired ? 'text-emerald-400 font-bold' : 'text-rose-300'}>
            {repaired ? active.fixFormula : active.formula}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">Datos:</strong> {active.brokenData} · <strong className="text-white">Causa:</strong> {active.cause}
        </p>
      </div>

      {/* ##### Desbordamiento por ancho de columna */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-100">
            Prueba extra: Error visual <span className="font-mono text-amber-600 dark:text-amber-300">#####</span> (columna angosta)
          </span>
          <span className="font-mono text-slate-500 dark:text-slate-400">Ancho: {colWidth}px</span>
        </div>
        <input
          type="range"
          min={50}
          max={150}
          value={colWidth}
          onChange={(e) => setColWidth(Number(e.target.value))}
          className="w-full accent-[#107C41]"
        />
        <div className="flex items-center gap-3">
          <div
            style={{ width: `${colWidth}px` }}
            className="border-2 border-[#107C41] bg-emerald-50/40 dark:bg-emerald-950/30 px-2 py-2 font-mono text-xs font-bold text-right overflow-hidden whitespace-nowrap"
          >
            {colWidth < 92 ? '#####' : '$1,250.00'}
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300">
            {colWidth < 92
              ? 'No es un error de fórmula: solo ensancha la columna (doble clic entre letras).'
              : '¡Columna ajustada! Ahora el número completo es visible.'}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  0.7 Anidar funciones                                              */
/* ------------------------------------------------------------------ */
const NestedFunctionsSim: React.FC = () => {
  const [step, setStep] = useState<'inner' | 'outer'>('inner');
  const [scores, setScores] = useState([84, 91, 77, 89]);
  const [decimals, setDecimals] = useState(1);

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(avg * factor) / factor;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 p-4 space-y-3 text-slate-100">
        <div className="text-xs font-semibold text-slate-400">
          Paréntesis emparejados por color (siempre se resuelve primero el más interno):
        </div>
        <div className="font-mono text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed">
          <span className="text-slate-400">=</span>
          <span className="text-emerald-400 font-bold">REDONDEAR</span>
          <span className="text-emerald-300 font-bold">(</span>
          <span className="text-cyan-300 font-bold">PROMEDIO</span>
          <span className="text-amber-300 font-bold">(</span>
          <span className="text-white">B2:B5</span>
          <span className="text-amber-300 font-bold">)</span>
          <span className="text-slate-400">; </span>
          <span className="text-emerald-200">{decimals}</span>
          <span className="text-emerald-300 font-bold">)</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStep('inner')}
            className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold border ${
              step === 'inner'
                ? 'bg-cyan-600 border-cyan-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            Paso 1: Función interna PROMEDIO(B2:B5)
          </button>
          <button
            type="button"
            onClick={() => setStep('outer')}
            className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold border ${
              step === 'outer'
                ? 'bg-[#107C41] border-emerald-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            Paso 2: Función externa REDONDEAR(...; {decimals})
          </button>
        </div>

        <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 font-mono text-xs">
          {step === 'inner' ? (
            <span className="text-cyan-300">
              PROMEDIO({scores.join('; ')}) = <strong>{avg}</strong> → Este valor pasa directo como argumento 1 de REDONDEAR.
            </span>
          ) : (
            <span className="text-emerald-400">
              REDONDEAR(<strong>{avg}</strong>; {decimals}) = <strong className="text-lg">{rounded}</strong>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {scores.map((val, i) => (
          <label key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs">
            <span className="font-mono font-bold text-slate-500 block">B{i + 2}</span>
            <input
              type="number"
              value={val}
              onChange={(e) => {
                const next = [...scores];
                next[i] = Number(e.target.value) || 0;
                setScores(next);
              }}
              className="mt-1 w-full bg-transparent font-mono font-bold text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </label>
        ))}
        <label className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs">
          <span className="font-mono font-bold text-slate-500 block">Decimales</span>
          <select
            value={decimals}
            onChange={(e) => setDecimals(Number(e.target.value))}
            className="mt-1 w-full bg-transparent font-mono font-bold text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value={0}>0</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </label>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  2.1 Tipos de datos, alineación y controlador de relleno           */
/* ------------------------------------------------------------------ */
const FILL_PRESETS: Record<string, string[]> = {
  Lunes: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
  Enero: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'],
  '10, 20': ['10', '20', '30', '40', '50'],
  'Producto 1': ['Producto 1', 'Producto 2', 'Producto 3', 'Producto 4', 'Producto 5'],
};

const DataFillHandleSim: React.FC = () => {
  const [cellInput, setCellInput] = useState('1250');
  const [seriesKey, setSeriesKey] = useState<keyof typeof FILL_PRESETS>('Lunes');
  const [fillCount, setFillCount] = useState(3);

  const trimmed = cellInput.trim();
  const isFormula = trimmed.startsWith('=');
  const isNumber = !isFormula && trimmed !== '' && !Number.isNaN(Number(trimmed.replace(',', '.')));
  const isDate = !isFormula && /^\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?$/.test(trimmed);
  const alignRight = isNumber || isDate;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
            1. Detector automático: Texto (izquierda) vs Número/Fecha (derecha)
          </div>
          <input
            type="text"
            value={cellInput}
            onChange={(e) => setCellInput(e.target.value)}
            placeholder="Escribe texto, número o fecha..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-mono text-base sm:text-xs text-slate-900 dark:text-white"
          />
          <div className="border-2 border-[#107C41] rounded-lg px-3 py-2.5 bg-emerald-50/30 dark:bg-emerald-950/20 font-mono text-sm">
            <div className={alignRight ? 'text-right text-blue-700 dark:text-cyan-300 font-bold' : 'text-left text-slate-800 dark:text-slate-100'}>
              {cellInput || '(celda vacía)'}
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Tipo detectado:{' '}
            <strong>
              {isFormula ? 'Fórmula (=)' : isNumber ? 'Número (alineado a la derecha)' : isDate ? 'Fecha (alineada a la derecha)' : 'Texto (alineado a la izquierda)'}
            </strong>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
            2. Controlador de relleno (+ esquina inferior derecha)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(FILL_PRESETS).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSeriesKey(k)}
                className={`min-h-[38px] px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                  seriesKey === k
                    ? 'bg-[#107C41] text-white border-[#107C41]'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          <label className="block text-xs space-y-1">
            <span className="text-slate-600 dark:text-slate-300">Arrastrar controlador hacia abajo ({fillCount} filas):</span>
            <input
              type="range"
              min={1}
              max={5}
              value={fillCount}
              onChange={(e) => setFillCount(Number(e.target.value))}
              className="w-full accent-[#107C41]"
            />
          </label>
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
            {FILL_PRESETS[seriesKey].slice(0, fillCount).map((item, idx) => (
              <div key={item} className="grid grid-cols-[44px_1fr] text-xs font-mono">
                <span className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 border-r border-slate-200 dark:border-slate-700">
                  A{idx + 1}
                </span>
                <span className={`px-3 py-1.5 ${idx === 0 ? 'font-bold bg-emerald-50 dark:bg-emerald-950/30' : ''}`}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  2.2 / 2.3 Formato desde Inicio y formatos de número               */
/* ------------------------------------------------------------------ */
const NumberFormattingSim: React.FC = () => {
  const [rawValue, setRawValue] = useState(0.15);
  const [numFormat, setNumFormat] = useState<'general' | 'number' | 'currency' | 'percent' | 'date'>('percent');
  const [bold, setBold] = useState(true);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('right');
  const [headerBg, setHeaderBg] = useState(false);

  const formatted = useMemo(() => {
    if (numFormat === 'general') return String(rawValue);
    if (numFormat === 'number') return rawValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (numFormat === 'currency') return `$${rawValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (numFormat === 'percent') return `${(rawValue * 100).toFixed(0)} %`;
    return '15/05/2026';
  }, [rawValue, numFormat]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/70 p-2.5">
        <button
          type="button"
          onClick={() => setBold((v) => !v)}
          className={`min-h-[40px] px-3 rounded-lg border text-xs font-bold ${
            bold ? 'bg-[#107C41] text-white border-[#107C41]' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
          }`}
        >
          N (Negrita)
        </button>
        <button
          type="button"
          onClick={() => setHeaderBg((v) => !v)}
          className={`min-h-[40px] px-3 rounded-lg border text-xs font-semibold ${
            headerBg ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
          }`}
        >
          Relleno de color
        </button>
        {(['left', 'center', 'right'] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAlign(a)}
            className={`min-h-[40px] px-2.5 rounded-lg border text-xs font-semibold ${
              align === a ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
            }`}
          >
            {a === 'left' ? 'Izq' : a === 'center' ? 'Centro' : 'Der'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
          <label className="block text-xs space-y-1">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Valor real guardado en la celda (ej. 0.15 o 65):</span>
            <input
              type="number"
              step="0.05"
              value={rawValue}
              onChange={(e) => setRawValue(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-mono text-base sm:text-xs text-slate-900 dark:text-white"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'general', label: 'General' },
              { id: 'number', label: 'Número (0.00)' },
              { id: 'currency', label: 'Moneda ($)' },
              { id: 'percent', label: 'Porcentaje (%)' },
              { id: 'date', label: 'Fecha corta' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setNumFormat(fmt.id as typeof numFormat)}
                className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                  numFormat === fmt.id
                    ? 'bg-[#107C41] text-white border-[#107C41]'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 p-4 space-y-3 text-slate-100">
          <div className="text-xs text-slate-400">
            Barra de fórmulas (valor real): <span className="font-mono text-cyan-300 font-bold">{rawValue}</span>
          </div>
          <div
            className={`rounded-lg border-2 border-[#107C41] px-4 py-4 font-mono text-xl ${
              headerBg ? 'bg-blue-900/50 text-white' : 'bg-slate-900 text-emerald-400'
            } ${bold ? 'font-bold' : 'font-normal'} ${
              align === 'left' ? 'text-left' : align === 'center' ? 'text-center' : 'text-right'
            }`}
          >
            {formatted}
          </div>
          <p className="text-xs text-slate-300">
            El formato solo cambia la presentación visual; Excel sigue calculando con el número real guardado ({rawValue}).
          </p>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  4.1 SUMA, RESTA y PRODUCTO                                        */
/* ------------------------------------------------------------------ */
const MathBasicSim: React.FC = () => {
  const [rows, setRows] = useState([5, 7, 8, 10]);
  const [b1, setB1] = useState(100);
  const [b2, setB2] = useState(37);

  const sum = rows.reduce((a, b) => a + b, 0);
  const prod = rows.slice(0, 3).reduce((a, b) => a * b, 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
          Edita las celdas A1:A4 y B1:B2
        </div>
        <div className="grid grid-cols-2 gap-2">
          {rows.map((v, i) => (
            <label key={i} className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs">
              <span className="font-mono font-bold text-slate-500 block">A{i + 1}</span>
              <input
                type="number"
                value={v}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = Number(e.target.value) || 0;
                  setRows(next);
                }}
                className="w-full bg-transparent font-mono font-bold text-base sm:text-xs focus:outline-none"
              />
            </label>
          ))}
          <label className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs">
            <span className="font-mono font-bold text-slate-500 block">B1</span>
            <input
              type="number"
              value={b1}
              onChange={(e) => setB1(Number(e.target.value) || 0)}
              className="w-full bg-transparent font-mono font-bold text-base sm:text-xs focus:outline-none"
            />
          </label>
          <label className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs">
            <span className="font-mono font-bold text-slate-500 block">B2</span>
            <input
              type="number"
              value={b2}
              onChange={(e) => setB2(Number(e.target.value) || 0)}
              className="w-full bg-transparent font-mono font-bold text-base sm:text-xs focus:outline-none"
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 p-4 space-y-3 text-slate-100">
        <div className="text-xs font-bold text-emerald-400">Regla clave: se operan celdas, no números fijos</div>
        <div className="divide-y divide-slate-800 text-xs font-mono">
          <div className="py-2 flex items-center justify-between gap-2">
            <span className="text-cyan-300">=SUMA(A1:A4)</span>
            <span className="text-lg font-bold text-emerald-400">{sum}</span>
          </div>
          <div className="py-2 flex items-center justify-between gap-2">
            <span className="text-cyan-300">=B1-B2</span>
            <span className="text-lg font-bold text-emerald-400">{b1 - b2}</span>
          </div>
          <div className="py-2 flex items-center justify-between gap-2">
            <span className="text-cyan-300">=PRODUCTO(A1:A3)</span>
            <span className="text-lg font-bold text-emerald-400">{prod}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  4.2 REDONDEAR / REDONDEAR.MAS / REDONDEAR.MENOS                   */
/* ------------------------------------------------------------------ */
function excelRoundHalfAway(num: number, dec: number): number {
  const factor = Math.pow(10, dec);
  const sign = num < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(num) * factor)) / factor;
}

function excelRoundUp(num: number, dec: number): number {
  const factor = Math.pow(10, dec);
  const sign = num < 0 ? -1 : 1;
  return (sign * Math.ceil(Math.abs(num) * factor - 1e-12)) / factor;
}

function excelRoundDown(num: number, dec: number): number {
  const factor = Math.pow(10, dec);
  const sign = num < 0 ? -1 : 1;
  return (sign * Math.floor(Math.abs(num) * factor + 1e-12)) / factor;
}

const RoundingSim: React.FC = () => {
  const [val, setVal] = useState(10.567);
  const [dec, setDec] = useState(2);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs space-y-1">
          <span className="font-semibold text-slate-700 dark:text-slate-200">Número (A1):</span>
          <input
            type="number"
            step="0.01"
            value={val}
            onChange={(e) => setVal(Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-mono text-base sm:text-xs"
          />
          <div className="flex flex-wrap gap-1 pt-1">
            {[10.567, -10.567, 10.1, 10.9].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setVal(preset)}
                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] hover:bg-emerald-100 dark:hover:bg-emerald-950"
              >
                {preset}
              </button>
            ))}
          </div>
        </label>

        <label className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs space-y-2">
          <span className="font-semibold text-slate-700 dark:text-slate-200">núm_decimales: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{dec}</strong></span>
          <input
            type="range"
            min={-1}
            max={3}
            value={dec}
            onChange={(e) => setDec(Number(e.target.value))}
            className="w-full accent-[#107C41]"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            0 = entero · 2 = centavos · -1 = decenas (múltiplos de 10).
          </p>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { fn: `=REDONDEAR(A1; ${dec})`, out: excelRoundHalfAway(val, dec), desc: 'Redondeo estándar al más cercano' },
          { fn: `=REDONDEAR.MAS(A1; ${dec})`, out: excelRoundUp(val, dec), desc: 'Siempre aleja el valor del cero' },
          { fn: `=REDONDEAR.MENOS(A1; ${dec})`, out: excelRoundDown(val, dec), desc: 'Siempre corta hacia cero' },
        ].map((card) => (
          <div key={card.fn} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 p-4 space-y-1.5 text-slate-100">
            <div className="font-mono text-xs text-cyan-300">{card.fn}</div>
            <div className="text-2xl font-mono font-bold text-emerald-400">{card.out}</div>
            <div className="text-[11px] text-slate-400">{card.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  4.3 ENTERO, TRUNCAR, RESIDUO, POTENCIA, RAIZ, ABS                 */
/* ------------------------------------------------------------------ */
const IntModPowerSim: React.FC = () => {
  const [decNum, setDecNum] = useState(-4.3);
  const [dividend, setDividend] = useState(53);
  const [divisor, setDivisor] = useState(12);
  const [base, setBase] = useState(4);
  const [exp, setExp] = useState(3);
  const [negDelta, setNegDelta] = useState(-80);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
          Bloque A: ENTERO, TRUNCAR y RESIDUO
        </div>
        <label className="block text-xs">
          <span className="text-slate-600 dark:text-slate-300">Número decimal (prueba negativos como -4.3):</span>
          <input
            type="number"
            step="0.1"
            value={decNum}
            onChange={(e) => setDecNum(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-mono text-base sm:text-xs"
          />
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-950 text-slate-100">
            <span className="text-cyan-300 block">=ENTERO(A1)</span>
            <strong className="text-lg text-emerald-400">{Math.floor(decNum)}</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 text-slate-100">
            <span className="text-cyan-300 block">=TRUNCAR(A1)</span>
            <strong className="text-lg text-emerald-400">{Math.trunc(decNum)}</strong>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <label className="text-xs">
            <span>Dividendo</span>
            <input type="number" value={dividend} onChange={(e) => setDividend(Number(e.target.value) || 0)} className="mt-1 w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 font-mono text-base sm:text-xs" />
          </label>
          <label className="text-xs">
            <span>Divisor</span>
            <input type="number" value={divisor} onChange={(e) => setDivisor(Number(e.target.value) || 0)} className="mt-1 w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 font-mono text-base sm:text-xs" />
          </label>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 text-xs font-mono text-slate-100 flex items-center justify-between">
          <span className="text-cyan-300">=RESIDUO({dividend}; {divisor})</span>
          <strong className="text-lg text-emerald-400">{divisor === 0 ? '#¡DIV/0!' : dividend % divisor}</strong>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
          Bloque B: POTENCIA, RAIZ y ABS
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs">
            <span>Base</span>
            <input type="number" value={base} onChange={(e) => setBase(Number(e.target.value) || 0)} className="mt-1 w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 font-mono text-base sm:text-xs" />
          </label>
          <label className="text-xs">
            <span>Exponente</span>
            <input type="number" value={exp} onChange={(e) => setExp(Number(e.target.value) || 0)} className="mt-1 w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 font-mono text-base sm:text-xs" />
          </label>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 text-xs font-mono text-slate-100 flex items-center justify-between">
          <span className="text-cyan-300">=POTENCIA({base}; {exp})</span>
          <strong className="text-lg text-emerald-400">{Math.pow(base, exp)}</strong>
        </div>
        <label className="block text-xs">
          <span>Desviación / Número (prueba signo negativo):</span>
          <input type="number" value={negDelta} onChange={(e) => setNegDelta(Number(e.target.value) || 0)} className="mt-1 w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 font-mono text-base sm:text-xs" />
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-950 text-slate-100">
            <span className="text-cyan-300 block">=ABS({negDelta})</span>
            <strong className="text-lg text-emerald-400">{Math.abs(negDelta)}</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 text-slate-100">
            <span className="text-cyan-300 block">=RAIZ(ABS(...))</span>
            <strong className="text-lg text-emerald-400">{Math.sqrt(Math.abs(negDelta)).toFixed(2)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  4.4 PROMEDIO, MEDIANA, MODA                                       */
/* ------------------------------------------------------------------ */
const CentralTendencySim: React.FC = () => {
  const [nums, setNums] = useState([10, 20, 20, 30, 40]);

  const sorted = useMemo(() => [...nums].sort((a, b) => a - b), [nums]);
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  const median = sorted.length % 2 === 1 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  const mode = useMemo(() => {
    const counts = new Map<number, number>();
    nums.forEach((n) => counts.set(n, (counts.get(n) ?? 0) + 1));
    let best = nums[0];
    let bestCount = 0;
    counts.forEach((cnt, val) => {
      if (cnt > bestCount) {
        bestCount = cnt;
        best = val;
      }
    });
    return bestCount > 1 ? best : '#N/A (sin repetidos)';
  }, [nums]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="grid grid-cols-5 gap-2 flex-1 min-w-[260px]">
          {nums.map((n, i) => (
            <label key={i} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs">
              <span className="font-mono text-slate-500 block">A{i + 1}</span>
              <input
                type="number"
                value={n}
                onChange={(e) => {
                  const next = [...nums];
                  next[i] = Number(e.target.value) || 0;
                  setNums(next);
                }}
                className="w-full bg-transparent font-mono font-bold text-base sm:text-xs focus:outline-none"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setNums([10, 20, 20, 30, 500])}
          className="min-h-[44px] px-3 py-2 rounded-xl border border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs font-semibold"
        >
          Simular valor extremo (500)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 p-4 text-slate-100">
          <div className="font-mono text-xs text-cyan-300">=PROMEDIO(A1:A5)</div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">{avg.toFixed(1)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Sensible a valores atípicos muy altos o bajos.</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 p-4 text-slate-100">
          <div className="font-mono text-xs text-cyan-300">=MEDIANA(A1:A5)</div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">{median}</div>
          <p className="text-[11px] text-slate-400 mt-1">Ordenado: [{sorted.join(', ')}]. Resiste extremos.</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 p-4 text-slate-100">
          <div className="font-mono text-xs text-cyan-300">=MODA.UNO(A1:A5)</div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">{String(mode)}</div>
          <p className="text-[11px] text-slate-400 mt-1">El número que más veces se repite.</p>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  4.5 MAX, MIN, MAXIFS, MINIFS                                      */
/* ------------------------------------------------------------------ */
const ExtremesIfsSim: React.FC = () => {
  const [catFilter, setCatFilter] = useState<'Venta' | 'Otra'>('Venta');
  const [items, setItems] = useState([
    { cat: 'Venta', val: 100 },
    { cat: 'Venta', val: 200 },
    { cat: 'Venta', val: 20 },
    { cat: 'Otra', val: 350 },
    { cat: 'Otra', val: 80 },
  ]);

  const allVals = items.map((i) => i.val);
  const filteredVals = items.filter((i) => i.cat === catFilter).map((i) => i.val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-semibold">
          <span>Tabla A2:B6 (Edita montos)</span>
          <div className="flex gap-1">
            {(['Venta', 'Otra'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCatFilter(c)}
                className={`px-2.5 py-1 rounded text-xs font-bold ${
                  catFilter === c ? 'bg-[#107C41] text-white' : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700'
                }`}
              >
                Filtro: {c}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-[1fr_1fr] items-center px-3 py-2 text-xs ${
                item.cat === catFilter ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
              }`}
            >
              <span className="font-semibold">{item.cat}</span>
              <input
                type="number"
                value={item.val}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...next[idx], val: Number(e.target.value) || 0 };
                  setItems(next);
                }}
                className="rounded border border-slate-200 dark:border-slate-700 bg-transparent px-2 py-1 font-mono text-base sm:text-xs"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 p-4 space-y-2.5 text-slate-100 font-mono text-xs">
        <div className="flex justify-between py-1.5 border-b border-slate-800">
          <span className="text-slate-300">=MAX(B2:B6)</span>
          <strong className="text-base text-white">{Math.max(...allVals)}</strong>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-800">
          <span className="text-slate-300">=MIN(B2:B6)</span>
          <strong className="text-base text-white">{Math.min(...allVals)}</strong>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-800">
          <span className="text-cyan-300">=MAX.SI.CONJUNTO(B2:B6; A2:A6; &quot;{catFilter}&quot;)</span>
          <strong className="text-lg text-emerald-400">{Math.max(...filteredVals)}</strong>
        </div>
        <div className="flex justify-between py-1.5">
          <span className="text-cyan-300">=MIN.SI.CONJUNTO(B2:B6; A2:A6; &quot;{catFilter}&quot;)</span>
          <strong className="text-lg text-emerald-400">{Math.min(...filteredVals)}</strong>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  4.6 CONTAR, CONTARA, CONTAR.BLANCO                                */
/* ------------------------------------------------------------------ */
type CellSampleKind = 'num' | 'zero' | 'text' | 'empty';

const CountingBasicSim: React.FC = () => {
  const [cells, setCells] = useState<CellSampleKind[]>(['num', 'zero', 'text', 'empty', 'num']);

  const cycleCell = (i: number) => {
    const order: CellSampleKind[] = ['num', 'zero', 'text', 'empty'];
    const next = [...cells];
    next[i] = order[(order.indexOf(cells[i]) + 1) % order.length];
    setCells(next);
  };

  const countNums = cells.filter((c) => c === 'num' || c === 'zero').length;
  const countA = cells.filter((c) => c !== 'empty').length;
  const countBlank = cells.filter((c) => c === 'empty').length;

  const displayMap: Record<CellSampleKind, string> = {
    num: '25 (Número)',
    zero: '0 (Cero numérico)',
    text: '"Pendiente" (Texto)',
    empty: '(Vacía)',
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-600 dark:text-slate-300">
        Haz clic en cualquiera de las 5 celdas B2:B6 para cambiar su contenido y observar qué cuenta cada función:
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {cells.map((kind, i) => (
          <button
            key={i}
            type="button"
            onClick={() => cycleCell(i)}
            className="min-h-[56px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-left hover:border-[#107C41] transition-colors"
          >
            <span className="font-mono text-[11px] font-bold text-slate-500 block">B{i + 2}</span>
            <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{displayMap[kind]}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 text-slate-100">
          <div className="font-mono text-xs text-cyan-300">=CONTAR(B2:B6)</div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">{countNums}</div>
          <p className="text-[11px] text-slate-400 mt-1">Cuenta solo números (incluye el 0, ignora texto y vacías).</p>
        </div>
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 text-slate-100">
          <div className="font-mono text-xs text-cyan-300">=CONTARA(B2:B6)</div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">{countA}</div>
          <p className="text-[11px] text-slate-400 mt-1">Cuenta cualquier celda ocupada (números + texto).</p>
        </div>
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 text-slate-100">
          <div className="font-mono text-xs text-cyan-300">=CONTAR.BLANCO(B2:B6)</div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">{countBlank}</div>
          <p className="text-[11px] text-slate-400 mt-1">Cuenta únicamente celdas vacías reales.</p>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  4.7 / 4.8 / 4.9 CONTAR.SI, SUMAR.SI, PROMEDIO.SI                  */
/* ------------------------------------------------------------------ */
const CONDITIONAL_ROWS = [
  { zona: 'Norte', canal: 'Web', monto: 350 },
  { zona: 'Sur', canal: 'Web', monto: 200 },
  { zona: 'Norte', canal: 'Tienda', monto: 250 },
  { zona: 'Norte', canal: 'Web', monto: 150 },
  { zona: 'Este', canal: 'Tienda', monto: 100 },
];

const ConditionalCalcSim: React.FC<{ mode: 'count' | 'sum' | 'avg' }> = ({ mode }) => {
  const [zona, setZona] = useState<'Norte' | 'Sur' | 'Este'>('Norte');
  const [canal, setCanal] = useState<'Todos' | 'Web' | 'Tienda'>('Web');

  const singleMatches = CONDITIONAL_ROWS.filter((r) => r.zona === zona);
  const multiMatches = CONDITIONAL_ROWS.filter((r) => r.zona === zona && (canal === 'Todos' || r.canal === canal));

  const calc = (list: typeof CONDITIONAL_ROWS) => {
    if (mode === 'count') return list.length;
    const sum = list.reduce((a, b) => a + b.monto, 0);
    if (mode === 'sum') return sum;
    return list.length ? Number((sum / list.length).toFixed(2)) : 0;
  };

  const fnPrefix = mode === 'count' ? 'CONTAR' : mode === 'sum' ? 'SUMAR' : 'PROMEDIO';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['Norte', 'Sur', 'Este'] as const).map((z) => (
          <button
            key={z}
            type="button"
            onClick={() => setZona(z)}
            className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold ${
              zona === z ? 'bg-[#107C41] text-white border-[#107C41]' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
            }`}
          >
            Zona: &quot;{z}&quot;
          </button>
        ))}
        {(['Todos', 'Web', 'Tienda'] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCanal(c)}
            className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold ${
              canal === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
            }`}
          >
            Canal: {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold border-b border-slate-200 dark:border-slate-700">
            <span>A (Zona)</span>
            <span>B (Canal)</span>
            <span className="text-right">C (Monto)</span>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {CONDITIONAL_ROWS.map((r, idx) => {
              const matched = r.zona === zona && (canal === 'Todos' || r.canal === canal);
              return (
                <div
                  key={idx}
                  className={`grid grid-cols-3 px-3 py-2 text-xs font-mono ${
                    matched ? 'bg-emerald-50 dark:bg-emerald-950/35 text-emerald-900 dark:text-emerald-200 font-bold' : 'text-slate-500'
                  }`}
                >
                  <span>{r.zona}</span>
                  <span>{r.canal}</span>
                  <span className="text-right">{r.monto}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 p-4 space-y-3 text-slate-100 font-mono text-xs">
          <div className="space-y-1 border-b border-slate-800 pb-3">
            <span className="text-slate-400 block font-sans">1 criterio ({fnPrefix}.SI):</span>
            <span className="text-cyan-300 whitespace-pre-wrap break-all block">
              ={fnPrefix}.SI(A2:A6; &quot;{zona}&quot;{mode === 'count' ? '' : '; C2:C6'})
            </span>
            <strong className="text-xl text-emerald-400">{calc(singleMatches)}</strong>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 block font-sans">
              Múltiples criterios ({fnPrefix}.SI.CONJUNTO — {mode === 'count' ? 'pares rango/criterio' : '¡rango de cálculo va PRIMERO!'}):
            </span>
            <span className="text-cyan-300 whitespace-pre-wrap break-all block">
              ={fnPrefix}.SI.CONJUNTO({mode === 'count' ? '' : 'C2:C6; '}A2:A6; &quot;{zona}&quot;{canal !== 'Todos' ? `; B2:B6; "${canal}"` : ''})
            </span>
            <strong className="text-xl text-emerald-400">{calc(multiMatches)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  4.10 SUBTOTALES con AutoFiltro                                    */
/* ------------------------------------------------------------------ */
const SUBTOTAL_DATA = [
  { id: 2, region: 'Norte', venta: 100 },
  { id: 3, region: 'Sur', venta: 200 },
  { id: 4, region: 'Norte', venta: 300 },
  { id: 5, region: 'Este', venta: 400 },
];

const SubtotalsFilterSim: React.FC = () => {
  const [filter, setFilter] = useState<'Todas' | 'Norte' | 'Sur'>('Norte');
  const [fnNum, setFnNum] = useState<9 | 1 | 2>(9);

  const visible = SUBTOTAL_DATA.filter((r) => filter === 'Todas' || r.region === filter);
  const normalSum = SUBTOTAL_DATA.reduce((a, b) => a + b.venta, 0);
  const subResult = useMemo(() => {
    if (fnNum === 9) return visible.reduce((a, b) => a + b.venta, 0);
    if (fnNum === 1) return visible.length ? Number((visible.reduce((a, b) => a + b.venta, 0) / visible.length).toFixed(1)) : 0;
    return visible.length;
  }, [visible, fnNum]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
          <Filter className="w-4 h-4 text-[#107C41]" /> AutoFiltro por Región:
        </span>
        {(['Todas', 'Norte', 'Sur'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold ${
              filter === f ? 'bg-[#107C41] text-white border-[#107C41]' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
        <select
          value={fnNum}
          onChange={(e) => setFnNum(Number(e.target.value) as 9 | 1 | 2)}
          className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-base sm:text-xs font-semibold"
        >
          <option value={9}>Código 9 → SUMA visible</option>
          <option value={1}>Código 1 → PROMEDIO visible</option>
          <option value={2}>Código 2 → CONTAR visible</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
          {SUBTOTAL_DATA.map((row) => {
            const isShown = filter === 'Todas' || row.region === filter;
            return (
              <div
                key={row.id}
                className={`grid grid-cols-[52px_1fr_80px] px-3 py-2.5 text-xs font-mono ${
                  isShown ? 'bg-white dark:bg-slate-900' : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 line-through opacity-60'
                }`}
              >
                <span>Fila {row.id}</span>
                <span>{row.region}</span>
                <span className="text-right font-bold">{row.venta}</span>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 p-4 space-y-3 text-slate-100 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <span className="text-amber-300 block">=SUMA(B2:B5)</span>
              <span className="text-[11px] font-sans text-slate-400">Incluye las filas ocultas por el filtro</span>
            </div>
            <strong className="text-xl text-amber-300">{normalSum}</strong>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-emerald-400 block">=SUBTOTALES({fnNum}; B2:B5)</span>
              <span className="text-[11px] font-sans text-slate-400">Calcula solo las {visible.length} filas visibles</span>
            </div>
            <strong className="text-2xl text-emerald-400">{subResult}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  4.11 ALEATORIO y ALEATORIO.ENTRE                                  */
/* ------------------------------------------------------------------ */
const RandomGenSim: React.FC = () => {
  const [minVal, setMinVal] = useState(1);
  const [maxVal, setMaxVal] = useState(6);
  const [seed, setSeed] = useState(0);

  const sample = useMemo(() => {
    void seed;
    const lo = Math.min(minVal, maxVal);
    const hi = Math.max(minVal, maxVal);
    return {
      rand: Number(Math.random().toFixed(4)),
      between: Math.floor(Math.random() * (hi - lo + 1)) + lo,
      batch: Array.from({ length: 5 }, () => Math.floor(Math.random() * (hi - lo + 1)) + lo),
    };
  }, [minVal, maxVal, seed]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs">
          <span className="block text-slate-600 dark:text-slate-300 font-semibold">inferior</span>
          <input type="number" value={minVal} onChange={(e) => setMinVal(Number(e.target.value) || 0)} className="mt-1 w-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono text-base sm:text-xs" />
        </label>
        <label className="text-xs">
          <span className="block text-slate-600 dark:text-slate-300 font-semibold">superior</span>
          <input type="number" value={maxVal} onChange={(e) => setMaxVal(Number(e.target.value) || 0)} className="mt-1 w-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono text-base sm:text-xs" />
        </label>
        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#107C41] hover:bg-emerald-700 text-white text-xs font-semibold"
        >
          <Dices className="w-4 h-4" />
          <span>Recalcular (F9)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 text-slate-100">
          <div className="font-mono text-xs text-cyan-300">=ALEATORIO()</div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">{sample.rand}</div>
          <p className="text-[11px] text-slate-400 mt-1">Decimal volátil entre 0 y 1 sin argumentos dentro de ().</p>
        </div>
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 text-slate-100">
          <div className="font-mono text-xs text-cyan-300">=ALEATORIO.ENTRE({Math.min(minVal, maxVal)}; {Math.max(minVal, maxVal)})</div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">{sample.between}</div>
          <p className="text-[11px] text-slate-400 mt-1">Muestra de 5 celdas: [{sample.batch.join(', ')}]</p>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  4.12 SI() + Simulador 3D                                          */
/* ------------------------------------------------------------------ */
const IfLogicSim: React.FC<{ onInteract?: () => void }> = ({ onInteract }) => {
  const [score, setScore] = useState(78);
  const [attendance, setAttendance] = useState(90);

  const simpleResult = score >= 60 ? 'Aprobado' : 'Reprobado';
  const nestedResult = score >= 90 ? 'Excelente' : score >= 75 ? 'Muy bien' : score >= 60 ? 'Aprobado' : 'Reprobado';
  const andResult = score >= 70 && attendance >= 80 ? 'Beca Activa' : 'Sin Beca';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs space-y-1.5">
          <span className="font-semibold text-slate-700 dark:text-slate-200">A1 (Nota del alumno): <strong className="font-mono text-emerald-600 dark:text-emerald-400">{score}</strong></span>
          <input
            type="range"
            min={0}
            max={100}
            value={score}
            onChange={(e) => {
              setScore(Number(e.target.value));
              onInteract?.();
            }}
            className="w-full accent-[#107C41]"
          />
        </label>
        <label className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs space-y-1.5">
          <span className="font-semibold text-slate-700 dark:text-slate-200">B1 (% Asistencia): <strong className="font-mono text-blue-600 dark:text-cyan-300">{attendance}%</strong></span>
          <input
            type="range"
            min={0}
            max={100}
            value={attendance}
            onChange={(e) => {
              setAttendance(Number(e.target.value));
              onInteract?.();
            }}
            className="w-full accent-blue-600"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-xs font-mono text-slate-100 space-y-1">
          <div className="text-cyan-300 whitespace-pre-wrap break-words">=SI(A1&gt;=60; &quot;Aprobado&quot;; &quot;Reprobado&quot;)</div>
          <div className={`text-lg font-bold ${score >= 60 ? 'text-emerald-400' : 'text-rose-400'}`}>{simpleResult}</div>
        </div>
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-xs font-mono text-slate-100 space-y-1">
          <div className="text-amber-300 whitespace-pre-wrap break-words">=SI(A1&gt;=90; &quot;Excelente&quot;; SI(A1&gt;=75; ...))</div>
          <div className="text-lg font-bold text-amber-300">{nestedResult}</div>
        </div>
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-xs font-mono text-slate-100 space-y-1">
          <div className="text-sky-300 whitespace-pre-wrap break-words">=SI(Y(A1&gt;=70; B1&gt;=80); &quot;Beca Activa&quot;; ...)</div>
          <div className="text-lg font-bold text-sky-300">{andResult}</div>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="h-[360px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center text-xs text-slate-400">
            Cargando Simulador 3D de =SI()...
          </div>
        }
      >
        <ExcelSimulator3D compact externalMode="SI" onInteract={onInteract} />
      </Suspense>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Componente principal: selecciona el simulador del tema actual     */
/* ------------------------------------------------------------------ */
export const ExcelTopicSimulator: React.FC<ExcelTopicSimulatorProps> = ({ lessonId, onInteract }) => {
  const meta = getTopicSimulatorMeta(lessonId);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
            <Sparkles className="w-4 h-4 text-[#107C41] dark:text-emerald-400 shrink-0" />
            <span>{meta.topicLabel}</span>
          </div>
          <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 mt-0.5 leading-relaxed">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {lessonId === 'm1-l1' && <OperadoresComparacionSimulator onInteract={onInteract} />}
      {INTERMEDIATE_KINDS.has(meta.kind as IntermediateSimKind) && lessonId !== 'm1-l1' && (
        <IntermediateTopicSim kind={meta.kind as IntermediateSimKind} lessonTitle={lessonId} />
      )}
      {meta.kind === 'screen-9' && <ExcelScreenInterfaceViewer />}
      {meta.kind === 'grid-basics' && <ExcelGridBasicsViewer />}
      {meta.kind === 'f4-references' && <ExcelF4ReferenceViewer />}
      {meta.kind === 'function-anatomy' && <FunctionAnatomySim />}
      {meta.kind === 'external-sheets' && <ExternalSheetsSim />}
      {meta.kind === 'operators-hierarchy' && <OperatorsHierarchySim />}
      {meta.kind === 'function-wizard' && <FunctionWizardSim />}
      {meta.kind === 'error-diagnostics' && <ErrorDiagnosticsSim />}
      {meta.kind === 'nested-functions' && <NestedFunctionsSim />}
      {meta.kind === 'data-fill-handle' && <DataFillHandleSim />}
      {meta.kind === 'number-formatting' && <NumberFormattingSim />}
      {meta.kind === 'math-basic' && <MathBasicSim />}
      {meta.kind === 'rounding' && <RoundingSim />}
      {meta.kind === 'int-mod-power' && <IntModPowerSim />}
      {meta.kind === 'central-tendency' && <CentralTendencySim />}
      {meta.kind === 'extremes-ifs' && <ExtremesIfsSim />}
      {meta.kind === 'counting-basic' && <CountingBasicSim />}
      {meta.kind === 'conditional-calc' && (
        <ConditionalCalcSim
          mode={lessonId === 'les-excel-4-7' ? 'count' : lessonId === 'les-excel-4-8' ? 'sum' : 'avg'}
        />
      )}
      {meta.kind === 'subtotals-filter' && <SubtotalsFilterSim />}
      {meta.kind === 'random-gen' && <RandomGenSim />}
      {meta.kind === 'if-logic' && <IfLogicSim onInteract={onInteract} />}
    </div>
  );
};
