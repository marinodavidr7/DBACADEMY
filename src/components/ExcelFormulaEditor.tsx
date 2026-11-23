import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calculator, Equal, Link2, RotateCcw } from 'lucide-react';
import {
  evaluateExcelFormula,
  isExcelError,
  toNumeric,
  type CellPrimitive,
  type SheetCells,
} from '../utils/excelEngine';

const COLS = ['A', 'B', 'C', 'D', 'E'] as const;
const ROWS = [1, 2, 3, 4, 5, 6] as const;

interface EditorPreset {
  title: string;
  instruction: string;
  tip: string;
  targetCell: string;
  examples: string[];
  sheet: SheetCells;
}

const DEFAULT_PRESET: EditorPreset = {
  title: 'Práctica: Escribe fórmulas en Excel',
  instruction:
    'Escribe una fórmula que empiece con = en la barra de fórmulas o pulsa una sugerencia para probarla sobre la cuadrícula.',
  tip: 'Haz clic en una celda mientras escribes una fórmula para insertar su coordenada automáticamente.',
  targetCell: 'D6',
  examples: ['=SUMA(B2:B5)', '=B2*C2', '=PROMEDIO(B2:B5)'],
  sheet: {
    A1: 'Producto', B1: 'Precio', C1: 'Cant', D1: 'Total', E1: 'Obs',
    A2: 'Manzana', B2: 3.5, C2: 2, D2: '=B2*C2', E2: '',
    A3: 'Leche', B3: 1.2, C3: 5, D3: '=B3*C3', E3: '',
    A4: 'Papel', B4: 12.5, C4: 1, D4: '=B4*C4', E4: '',
    A5: 'Lápiz', B5: 0.8, C5: 10, D5: '=B5*C5', E5: '',
    A6: 'Total', B6: '', C6: '', D6: '=SUMA(B2:B5)', E6: '',
  },
};

const LESSON_EDITOR_PRESETS: Record<string, EditorPreset> = {
  'les-excel-0-1': {
    title: '0.1 Laboratorio: Anatomía de una función (=SUMA)',
    instruction:
      'Toda función inicia con = seguido de su nombre y argumentos entre paréntesis. Edita B6 para cambiar entre SUMA, PROMEDIO o MAX.',
    tip: 'Observa las piezas en =SUMA(B2:B5): signo igual (=), nombre (SUMA) y rango entre paréntesis (B2:B5).',
    targetCell: 'B6',
    examples: ['=SUMA(B2:B5)', '=PROMEDIO(B2:B5)', '=MAX(B2:B5)', '=CONTAR(B2:B5)'],
    sheet: {
      A1: 'Mes', B1: 'Ventas', C1: 'Meta', D1: 'Cumpl.', E1: 'Nota',
      A2: 'Enero', B2: 1200, C2: 1000, D2: '=B2>=C2', E2: 'Base',
      A3: 'Febrero', B3: 1850, C3: 1500, D3: '=B3>=C3', E3: '',
      A4: 'Marzo', B4: 2100, C4: 2000, D4: '=B4>=C4', E4: '',
      A5: 'Abril', B5: 1650, C5: 1800, D5: '=B5>=C5', E5: '',
      A6: 'Resumen', B6: '=SUMA(B2:B5)', C6: '=SUMA(C2:C5)', D6: '', E6: '',
    },
  },
  'les-excel-0-2': {
    title: '0.2 Laboratorio: Referencias absolutas ($E$1) e ITBIS',
    instruction:
      'La tasa fija de impuesto (0.18) vive en E1. Comprueba en D2 cómo =C2*$E$1 multiplica el subtotal por esa celda anclada.',
    tip: 'El signo $ fija columna y fila ($E$1) para que la tasa no cambie al copiar la fórmula hacia abajo.',
    targetCell: 'D2',
    examples: ['=C2*$E$1', '=C3*$E$1', '=C2*(1+$E$1)', '=SUMA(C2:C5)*$E$1'],
    sheet: {
      A1: 'Artículo', B1: 'Cant', C1: 'Subtotal', D1: 'ITBIS', E1: 0.18,
      A2: 'Teclado', B2: 2, C2: 1500, D2: '=C2*$E$1', E2: 'Tasa 18%',
      A3: 'Monitor', B3: 1, C3: 8500, D3: '=C3*$E$1', E3: '',
      A4: 'Mouse', B4: 4, C4: 650, D4: '=C4*$E$1', E4: '',
      A5: 'Cable', B5: 3, C5: 300, D5: '=C5*$E$1', E5: '',
      A6: 'Total', B6: '', C6: '=SUMA(C2:C5)', D6: '', E6: '',
    },
  },
  'les-excel-0-3': {
    title: '0.3 Laboratorio: Consolidación de hojas y resúmenes (!)',
    instruction:
      'Combina los acumulados de cada sucursal en D2:D6. En libros con varias pestañas se antepone NombreHoja! (ej. Norte!B2).',
    tip: 'Selecciona D6 para consolidar los dos trimestres en un solo total anual.',
    targetCell: 'D6',
    examples: ['=SUMA(D2:D5)', '=B2+C2', '=SUMA(B2:B5)', '=SUMA(C2:C5)'],
    sheet: {
      A1: 'Sucursal', B1: 'Trim 1', C1: 'Trim 2', D1: 'Anual', E1: 'Sede',
      A2: 'Norte', B2: 4200, C2: 5100, D2: '=B2+C2', E2: 'Hoja1',
      A3: 'Centro', B3: 6800, C3: 7200, D3: '=B3+C3', E3: 'Hoja2',
      A4: 'Sur', B4: 3100, C4: 3900, D4: '=B4+C4', E4: 'Hoja3',
      A5: 'Este', B5: 2500, C5: 2800, D5: '=B5+C5', E5: 'Hoja4',
      A6: 'Global', B6: '=SUMA(B2:B5)', C6: '=SUMA(C2:C5)', D6: '=SUMA(D2:D5)', E6: '',
    },
  },
  'les-excel-0-4': {
    title: '0.4 Laboratorio: Operadores, paréntesis y concatenación (&)',
    instruction:
      'Prueba el orden de evaluación entre =(B2+C2)*D2 y =B2+C2*D2, compara valores con >= o une textos usando &.',
    tip: 'Excel resuelve primero paréntesis (), luego potencias ^, después */ y por último +- .',
    targetCell: 'E2',
    examples: ['=(B2+C2)*D2', '=B2+C2*D2', '=B3>=C3', '=B5&" "&C5'],
    sheet: {
      A1: 'Prueba', B1: 'Valor A', C1: 'Valor B', D1: 'Factor', E1: 'Salida',
      A2: 'Jerarquía', B2: 2, C2: 3, D2: 4, E2: '=(B2+C2)*D2',
      A3: 'Meta', B3: 85, C3: 70, D3: 1, E3: '=B3>=C3',
      A4: 'Potencia', B4: 3, C4: 2, D4: 10, E4: '=B4^C4',
      A5: 'Texto', B5: 'Excel', C5: 'Básico', D5: 2026, E5: '=B5&" "&C5',
      A6: '', B6: '', C6: '', D6: '', E6: '',
    },
  },
  'les-excel-0-5': {
    title: '0.5 Laboratorio: Asistente y cálculo estadístico rápido',
    instruction:
      'Calcula promedio, nota máxima o mínima de las evaluaciones editando B6 con =PROMEDIO(B2:B5), =MAX(B2:B5) o =MIN(B2:B5).',
    tip: 'En Excel real basta escribir =PRO y pulsar Tabulador para aceptar PROMEDIO( automáticamente.',
    targetCell: 'B6',
    examples: ['=PROMEDIO(B2:B5)', '=MAX(B2:B5)', '=MIN(B2:B5)', '=PROMEDIO(B2:C5)'],
    sheet: {
      A1: 'Alumno', B1: 'Nota 1', C1: 'Nota 2', D1: 'Prom.', E1: 'Estado',
      A2: 'Ana', B2: 92, C2: 88, D2: '=PROMEDIO(B2:C2)', E2: '',
      A3: 'Luis', B3: 78, C3: 84, D3: '=PROMEDIO(B3:C3)', E3: '',
      A4: 'Carla', B4: 95, C4: 97, D4: '=PROMEDIO(B4:C4)', E4: '',
      A5: 'Diego', B5: 81, C5: 79, D5: '=PROMEDIO(B5:C5)', E5: '',
      A6: 'Curso', B6: '=PROMEDIO(B2:B5)', C6: '=PROMEDIO(C2:C5)', D6: '', E6: '',
    },
  },
  'les-excel-0-6': {
    title: '0.6 Laboratorio: Diagnóstico y corrección de errores',
    instruction:
      'D2 produce #¡DIV/0! porque C2 vale 0. Cambia C2 por un número distinto de cero o envuelve la fórmula en =SI.ERROR(B2/C2; 0).',
    tip: 'También puedes comprobar #¡VALOR! evaluando =B3+C3 cuando B3 contiene texto.',
    targetCell: 'D2',
    examples: ['=B2/C2', '=SI.ERROR(B2/C2; 0)', '=B4/C4', '=B3+C3'],
    sheet: {
      A1: 'Caso', B1: 'Dividendo', C1: 'Divisor', D1: 'Resultado', E1: 'Nota',
      A2: 'Cero', B2: 100, C2: 0, D2: '=B2/C2', E2: 'Error #DIV/0!',
      A3: 'Texto', B3: 'abc', C3: 5, D3: '=B3+C3', E3: 'Error #VALOR!',
      A4: 'Correcto', B4: 240, C4: 6, D4: '=B4/C4', E4: 'Válido',
      A5: 'Ratio', B5: 90, C5: 3, D5: '=B5/C5', E5: 'Válido',
      A6: '', B6: '', C6: '', D6: '', E6: '',
    },
  },
  'les-excel-0-7': {
    title: '0.7 Laboratorio: Anidación de funciones (=REDONDEAR y =SI)',
    instruction:
      'Combina funciones colocando el resultado de PROMEDIO dentro de REDONDEAR o de SI en la celda D6.',
    tip: 'Valida primero la función interna PROMEDIO(B2:B5) antes de envolverla en REDONDEAR(...; 1).',
    targetCell: 'D6',
    examples: [
      '=REDONDEAR(PROMEDIO(B2:B5); 1)',
      '=SI(PROMEDIO(B2:B5)>=80; "Aprobado"; "Reforzar")',
      '=PROMEDIO(B2:B5)',
    ],
    sheet: {
      A1: 'Evaluación', B1: 'Puntaje', C1: 'Peso', D1: 'Ponderado', E1: '',
      A2: 'Parcial 1', B2: 84.33, C2: 0.25, D2: '=B2*C2', E2: '',
      A3: 'Parcial 2', B3: 91.67, C3: 0.25, D3: '=B3*C3', E3: '',
      A4: 'Proyecto', B4: 88.45, C4: 0.3, D4: '=B4*C4', E4: '',
      A5: 'Final', B5: 79.12, C5: 0.2, D5: '=B5*C5', E5: '',
      A6: 'Cierre', B6: '=PROMEDIO(B2:B5)', C6: '=SUMA(C2:C5)', D6: '=REDONDEAR(PROMEDIO(B2:B5); 1)', E6: '',
    },
  },
};

function getPresetForLesson(lessonId?: string): EditorPreset {
  if (lessonId && LESSON_EDITOR_PRESETS[lessonId]) {
    return LESSON_EDITOR_PRESETS[lessonId];
  }
  return DEFAULT_PRESET;
}

function getVal(cells: SheetCells, addr: string): CellPrimitive {
  return cells[addr] ?? '';
}

interface ExcelFormulaEditorProps {
  lessonId?: string;
}

export const ExcelFormulaEditor: React.FC<ExcelFormulaEditorProps> = ({ lessonId }) => {
  const preset = useMemo(() => getPresetForLesson(lessonId), [lessonId]);

  const [sheet, setSheet] = useState<SheetCells>(() => ({ ...preset.sheet }));
  const [selectedCell, setSelectedCell] = useState<string>(preset.targetCell);
  const [formulaDraft, setFormulaDraft] = useState<string>(
    String(preset.sheet[preset.targetCell] ?? '')
  );

  // Sync grid & active formula when user switches lessons
  useEffect(() => {
    setSheet({ ...preset.sheet });
    setSelectedCell(preset.targetCell);
    setFormulaDraft(String(preset.sheet[preset.targetCell] ?? ''));
  }, [preset]);

  const inFormulaMode = formulaDraft.startsWith('=');

  const handleCellClick = useCallback(
    (addr: string) => {
      if (inFormulaMode && addr !== selectedCell) {
        if (formulaDraft.endsWith(':')) {
          setFormulaDraft((prev) => prev + addr);
          return;
        }
        if (/[=+*^&(; ,-]$/.test(formulaDraft)) {
          setFormulaDraft((prev) => prev + addr);
        } else {
          setFormulaDraft((prev) => `${prev}; ${addr}`);
        }
        return;
      }
      setSelectedCell(addr);
      setFormulaDraft(String(getVal(sheet, addr) ?? ''));
    },
    [inFormulaMode, formulaDraft, selectedCell, sheet]
  );

  const commitFormula = useCallback(() => {
    const trimmed = formulaDraft.trim();
    const numericCandidate = Number(trimmed);
    const stored: CellPrimitive =
      trimmed !== '' && !trimmed.startsWith('=') && !Number.isNaN(numericCandidate)
        ? numericCandidate
        : trimmed;
    setSheet((prev) => ({ ...prev, [selectedCell]: stored }));
  }, [selectedCell, formulaDraft]);

  const applyQuickExample = (formula: string) => {
    setSelectedCell(preset.targetCell);
    setFormulaDraft(formula);
    setSheet((prev) => ({ ...prev, [preset.targetCell]: formula }));
  };

  const resetPlayground = () => {
    setSheet({ ...preset.sheet });
    setSelectedCell(preset.targetCell);
    setFormulaDraft(String(preset.sheet[preset.targetCell] ?? ''));
  };

  const formatCellDisplay = (addr: string): string => {
    const raw = getVal(sheet, addr);
    if (typeof raw === 'string' && raw.startsWith('=')) {
      const val = evaluateExcelFormula(raw, sheet, undefined, undefined);
      if (isExcelError(val)) return String(val);
      const n = toNumeric(val);
      if (n !== null) {
        return n.toLocaleString('es-ES', { maximumFractionDigits: 2 });
      }
      return String(val);
    }
    return String(raw);
  };

  const result = useMemo(() => {
    const formula = formulaDraft.trim();
    if (!formula.startsWith('=')) return null;
    const computed = evaluateExcelFormula(formula, sheet, undefined, undefined);
    if (isExcelError(computed)) return { isError: true, value: String(computed) };
    return { isError: false, value: computed };
  }, [formulaDraft, sheet]);

  const numericPreview = useMemo(() => {
    if (!result || result.isError) return null;
    const n = toNumeric(result.value);
    if (n === null) return null;
    return n.toLocaleString('es-ES', { maximumFractionDigits: 2 });
  }, [result]);

  return (
    <div className="w-full min-w-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0B1222] p-3.5 sm:p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Calculator className="w-4 h-4 text-[#107C41] dark:text-emerald-400 shrink-0" />
          <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
            {preset.title}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-semibold ${
              inFormulaMode
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300/70 dark:border-amber-800'
                : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-300/70 dark:border-emerald-800'
            }`}
          >
            {inFormulaMode ? 'Modo fórmula activo' : `Editando ${selectedCell}`}
          </span>
          <button
            type="button"
            onClick={resetPlayground}
            title="Restaurar hoja del ejercicio"
            aria-label="Restaurar hoja del ejercicio"
            className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-blue-500 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        {preset.instruction}
      </p>

      {/* Quick formula selector chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1">
          Probar en {preset.targetCell}:
        </span>
        {preset.examples.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => applyQuickExample(ex)}
            className={`min-h-[34px] rounded-md border px-2 py-1 font-mono text-[11px] font-semibold transition-colors ${
              formulaDraft.trim() === ex && selectedCell === preset.targetCell
                ? 'border-[#107C41] bg-emerald-50 text-[#107C41] dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-blue-500'
            }`}
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Formula bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-[32px] text-center font-mono text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2">
          {selectedCell}
        </span>
        <input
          value={formulaDraft}
          onChange={(e) => setFormulaDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitFormula();
          }}
          className="min-w-0 flex-1 min-h-[44px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-base sm:text-xs font-mono rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#107C41]"
          placeholder="Escribe una fórmula (ej. =SUMA(B2:B5)) o un número"
          aria-label="Barra de fórmulas interactiva"
        />
        {inFormulaMode && (
          <span className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-amber-300/80 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-2 text-[11px] font-semibold text-amber-800 dark:text-amber-200">
            <Link2 className="w-3.5 h-3.5" />
            Clic en celda inserta referencia
          </span>
        )}
        <button
          type="button"
          onClick={commitFormula}
          className="min-h-[44px] inline-flex items-center gap-1 rounded-lg bg-[#107C41] hover:bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
        >
          <Equal className="w-3.5 h-3.5" />
          <span>Aplicar</span>
        </button>
      </div>

      {/* Properly aligned Spreadsheet Grid */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <table className="w-full min-w-[460px] border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800">
              <th className="w-9 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold text-slate-400">
                #
              </th>
              {COLS.map((c) => (
                <th
                  key={c}
                  className={`w-24 border border-slate-200 dark:border-slate-700 py-1.5 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 ${
                    selectedCell.startsWith(c) ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#107C41] dark:text-emerald-300' : ''
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r}>
                <td
                  className={`w-9 border border-slate-200 dark:border-slate-700 text-center text-[11px] font-mono font-bold ${
                    selectedCell.endsWith(String(r))
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#107C41] dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {r}
                </td>
                {COLS.map((c) => {
                  const addr = `${c}${r}`;
                  const raw = getVal(sheet, addr);
                  const display = formatCellDisplay(addr);
                  const isActive = selectedCell === addr;
                  const inFormulaRef =
                    inFormulaMode &&
                    String(formulaDraft).toUpperCase().includes(addr) &&
                    !isActive;
                  const isTarget = addr === preset.targetCell;
                  const isErr =
                    typeof display === 'string' && display.startsWith('#');
                  return (
                    <td
                      key={addr}
                      onClick={() => handleCellClick(addr)}
                      className={`border border-slate-200 dark:border-slate-700 px-2 py-2 text-center text-xs font-mono cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[#107C41] text-white ring-2 ring-inset ring-emerald-300'
                          : inFormulaRef
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400'
                            : isTarget
                              ? 'bg-blue-50/70 dark:bg-blue-950/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'
                      } ${r === 1 && !isActive ? 'font-bold bg-slate-50 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100' : ''}`}
                      title={typeof raw === 'string' && raw.startsWith('=') ? `${addr}: ${raw}` : `Celda ${addr}`}
                    >
                      <span
                        className={`block text-[11px] truncate ${
                          isActive
                            ? 'text-white font-semibold'
                            : isErr
                              ? 'text-red-600 dark:text-red-400 font-bold'
                              : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {display || <span className="text-slate-300 dark:text-slate-700">{addr}</span>}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Live Formula Evaluation Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-slate-500 dark:text-slate-400">
            Resultado {selectedCell}:
          </span>
          {result ? (
            result.isError ? (
              <span className="font-mono font-bold text-red-600 dark:text-red-400">
                {result.value}
              </span>
            ) : numericPreview ? (
              <span className="font-mono font-bold text-[#107C41] dark:text-emerald-400 tabular-nums">
                {numericPreview}
              </span>
            ) : (
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
                {String(result.value)}
              </span>
            )
          ) : (
            <span className="font-mono text-slate-500 dark:text-slate-400">
              {String(getVal(sheet, selectedCell) || 'Celda vacía')}
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">{preset.tip}</span>
      </div>
    </div>
  );
};
