import React, { useCallback, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Calculator, Equal, Link2 } from 'lucide-react';
import { evaluateExcelFormula, isExcelError, toNumeric, type CellPrimitive, type SheetCells } from '../utils/excelEngine';

const COLS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
type Col = (typeof COLS)[number];
const ROWS = [1, 2, 3, 4, 5, 6] as const;
type Row = (typeof ROWS)[number];

const FREEFORM_DATA: SheetCells = {
  A1: 'Producto', B1: 'Precio', C1: 'Cant', D1: 'Total',
  A2: 'Manzana', B2: 3.5, C2: 2, D2: '',
  A3: 'Leche', B3: 1.2, C3: 5, D3: '',
  A4: 'Papel', B4: 12.5, C4: 1, D4: '',
  A5: 'Lápiz', B5: 0.8, C5: 10, D5: '',
  A6: '', B6: '', C6: '', D6: '=SUMA(B2:B5)',
};

function getVal(cells: SheetCells, addr: string): CellPrimitive {
  return cells[addr] ?? '';
}

export const ExcelFormulaEditor: React.FC = () => {
  const [sheet, setSheet] = useState<SheetCells>(() => ({ ...FREEFORM_DATA }));
  const [selectedCell, setSelectedCell] = useState('D6');
  const [formulaDraft, setFormulaDraft] = useState<string>(String(sheet[selectedCell] ?? ''));
  const [isEditingFormula, setIsEditingFormula] = useState(false);

  const inFormulaMode = formulaDraft.startsWith('=');

  const handleCellClick = useCallback(
    (addr: string) => {
      if (inFormulaMode) {
        // If the user typed a trailing colon, complete the range.
        if (formulaDraft.endsWith(':')) {
          setFormulaDraft((prev) => prev + addr);
          setIsEditingFormula(true);
          return;
        }
        // If there is no "=", or the formula ends with an operator, insert a ref.
        if (!formulaDraft.includes('=')) {
          setFormulaDraft((prev) => `=${addr}`);
        } else if (/[=+*^&(; ,]$/.test(formulaDraft)) {
          setFormulaDraft((prev) => prev + addr);
        } else {
          setFormulaDraft((prev) => `${prev}, ${addr}`);
        }
        setIsEditingFormula(true);
        return;
      }
      setSelectedCell(addr);
      setFormulaDraft(String(getVal(sheet, addr) ?? ''));
      setIsEditingFormula(false);
    },
    [inFormulaMode, formulaDraft, sheet]
  );

  const commitFormula = useCallback(() => {
    setSheet((prev) => ({ ...prev, [selectedCell]: formulaDraft.trim() }));
    setIsEditingFormula(false);
  }, [selectedCell, formulaDraft]);

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

  const inputClass =
    'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-mono rounded text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#107C41]';
  const cellClass = 'border border-slate-300 dark:border-slate-600 text-center text-xs font-mono';

  return (
    <div className="w-full rounded-xl border border-[#107C41]/30 bg-[#F0FDF4] dark:bg-[#0F1F2F] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-[#107C41]">
          <Calculator className="w-4 h-4" />
          Práctica: Escríbe fórmulas en Excel
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${inFormulaMode ? 'bg-[#FBBF24]' : 'bg-[#107C41] text-white'}`}>
          {inFormulaMode ? 'Modo fórmula (haz clic en celdas o rangos)' : 'Editando'}
        </span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        Escribe una fórmula que empiece con <code className="font-mono bg-white px-1 border border-slate-300">=</code>, p. ej. <code className="font-mono bg-white px-1 border border-slate-300">=SUMA(B2:B5)</code> o <code className="font-mono bg-white px-1 border border-slate-300">=B2*C2</code>. Haz clic en las celdas para introducir referencias y en <code className="font-mono bg-white px-1 border border-slate-300">B2:</code> para un rango.
      </p>

      {/* Formula bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-bold text-slate-500">{selectedCell}</span>
        <input
          value={formulaDraft}
          onChange={(e) => {
            setFormulaDraft(e.target.value);
            setIsEditingFormula(e.target.value.startsWith('='));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitFormula();
          }}
          onBlur={() => setIsEditingFormula(false)}
          className={`${inputClass} min-w-64 flex-1`}
          placeholder="Escribe una fórmula, por ejemplo =B2*C2"
          aria-label="Barra de fórmulas"
        />
        {inFormulaMode ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FBBF24] px-3 py-2 text-xs font-bold text-[#92400E]">
            <Link2 className="w-3.5 h-3.5" />
            Haz clic en una celda para sumarla
          </span>
        ) : (
          <button type="button" onClick={commitFormula} className="rounded-lg bg-[#107C41] px-3 py-2 text-xs font-bold text-white hover:bg-[#0d7a38]">
            <Equal className="w-3.5 h-3.5 inline mr-1" /> Enter
          </button>
        )}
        <button type="button" onClick={commitFormula} title="Aplicar fórmula" className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">
          Aplicar
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800">
              <th className="w-12 border border-slate-300 dark:border-slate-600 text-[10px] font-bold">A</th>
              {COLS.slice(1).map((c) => (
                <th key={c} className={`w-20 border border-slate-300 dark:border-slate-600 text-[10px] font-bold ${c === 'D' ? 'bg-amber-50 dark:bg-amber-950/40' : ''}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r}>
                <td className="w-12 border border-slate-300 dark:border-slate-600 text-center text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800">{r}</td>
                {COLS.slice(1).map((c) => {
                  const addr = `${c}${r}`;
                  const raw = getVal(sheet, addr);
                  const isActive = selectedCell === addr;
                  const inFormulaRef = inFormulaMode && String(formulaDraft).toUpperCase().includes(addr) && !isActive;
                  const target = addr === 'D6';
                  return (
                    <td
                      key={addr}
                      onClick={() => handleCellClick(addr)}
                      className={`${cellClass} p-2 cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[#107C41] text-white ring-2 ring-inset ring-[#107C41]'
                          : inFormulaRef
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400'
                            : target
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      } ${r === 1 ? 'font-bold bg-slate-50 dark:bg-slate-900' : ''}`}
                      title={`Celda ${addr}`}
                    >
                      <span className="text-slate-400 text-[9px] mr-1">{addr}</span>
                      <span className="block text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">{String(raw)}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Result panel */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-100 dark:bg-slate-800 p-3 text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-300">
          {selectedCell}:
        </span>
        {result ? (
          result.isError ? (
            <span className="font-mono font-bold text-red-600 dark:text-red-400">{result.value}</span>
          ) : numericPreview ? (
            <span className="font-mono font-bold text-[#107C41]">{numericPreview}</span>
          ) : (
            <span className="font-mono text-slate-600 dark:text-slate-300">{String(result.value)}</span>
          )
        ) : (
          <span className="font-mono text-slate-400 italic">Escribe una fórmula que empiece con =</span>
        )}
      </div>

      <p className="text-[10px] text-slate-500 dark:text-slate-400">
        Truco: escribe <code className="font-mono">B2:</code> y haz clic en <code className="font-mono">B8</code> para crear el rango <code className="font-mono">B2:B8</code>. Los resultados se muestran en D6 y se recalculan en tiempo real.
      </p>
      <div className="hidden">
        <ArrowRight className="w-3 h-3" /><ArrowDown className="w-3 h-3" /><ArrowUp className="w-3 h-3" /><ArrowLeft className="w-3 h-3" />
      </div>
    </div>
  );
};
