import React, { useMemo, useState } from 'react';

type CmpOp = '=' | '>' | '<' | '>=' | '<=' | '<>';

const OPS: { op: CmpOp; label: string; desc: string }[] = [
  { op: '=', label: 'Igual a', desc: 'Verdadero cuando ambos valores son iguales.' },
  { op: '>', label: 'Mayor que', desc: 'Verdadero cuando A es mayor que B.' },
  { op: '<', label: 'Menor que', desc: 'Verdadero cuando A es menor que B.' },
  { op: '>=', label: 'Mayor o igual', desc: 'Verdadero cuando A es mayor o igual que B.' },
  { op: '<=', label: 'Menor o igual', desc: 'Verdadero cuando A es menor o igual que B.' },
  { op: '<>', label: 'Distinto de', desc: 'Verdadero cuando los valores son diferentes.' },
];

function evaluate(a: number, op: CmpOp, b: number): boolean {
  switch (op) {
    case '=': return a === b;
    case '>': return a > b;
    case '<': return a < b;
    case '>=': return a >= b;
    case '<=': return a <= b;
    case '<>': return a !== b;
  }
}

function parseNum(v: string): number {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export interface OperadoresComparacionSimulatorProps {
  onInteract?: () => void;
  compact?: boolean;
}

export const OperadoresComparacionSimulator: React.FC<OperadoresComparacionSimulatorProps> = ({
  onInteract,
  compact = false,
}) => {
  const [aRaw, setARaw] = useState('10');
  const [bRaw, setBRaw] = useState('20');
  const [op, setOp] = useState<CmpOp>('>');

  const a = useMemo(() => parseNum(aRaw), [aRaw]);
  const b = useMemo(() => parseNum(bRaw), [bRaw]);
  const result = useMemo(() => evaluate(a, op, b), [a, op, b]);
  const active = OPS.find((o) => o.op === op) ?? OPS[0];

  const touch = () => onInteract?.();

  return (
    <div
      className={`w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/70 shadow-sm ${compact ? 'p-4' : 'p-5 sm:p-6'}`}
      data-testid="sim-operadores-comparacion"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
            Simulador interactivo
          </p>
          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            Operadores de comparación
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Cambia los valores y el operador para ver el resultado en vivo.
          </p>
        </div>
        <div
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tabular-nums ${
            result
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
          }`}
          aria-live="polite"
        >
          {result ? 'VERDADERO' : 'FALSO'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-end mb-5">
        <label className="block">
          <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Valor A</span>
          <input
            type="number"
            inputMode="decimal"
            value={aRaw}
            onChange={(e) => { setARaw(e.target.value); touch(); }}
            className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-base sm:text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            aria-label="Valor A"
          />
        </label>

        <div className="flex flex-col items-center justify-end pb-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Operador</span>
          <div className="min-w-[64px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-blue-200 dark:border-cyan-900/60 bg-blue-50 dark:bg-cyan-950/30 px-3 text-xl font-black tabular-nums text-blue-700 dark:text-cyan-300">
            {op}
          </div>
        </div>

        <label className="block">
          <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Valor B</span>
          <input
            type="number"
            inputMode="decimal"
            value={bRaw}
            onChange={(e) => { setBRaw(e.target.value); touch(); }}
            className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-base sm:text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            aria-label="Valor B"
          />
        </label>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Elige un operador</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {OPS.map((item) => {
            const selected = item.op === op;
            return (
              <button
                key={item.op}
                type="button"
                aria-pressed={selected}
                onClick={() => { setOp(item.op); touch(); }}
                className={`min-h-[44px] rounded-xl border px-2 py-2 text-sm font-bold tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                  selected
                    ? 'border-blue-600 bg-blue-600 text-white dark:border-cyan-500 dark:bg-cyan-600'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:border-blue-400 dark:hover:border-cyan-700'
                }`}
                title={item.label}
              >
                {item.op}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-sm text-slate-700 dark:text-slate-200">
            <span className="font-semibold tabular-nums">{aRaw || '0'}</span>{' '}
            <span className="font-black text-blue-700 dark:text-cyan-300">{op}</span>{' '}
            <span className="font-semibold tabular-nums">{bRaw || '0'}</span>
          </div>
          <div
            className={`text-sm font-black tabular-nums ${result ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}
            aria-live="polite"
          >
            = {result ? 'VERDADERO' : 'FALSO'}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {OPS.map((item) => (
            <button
              key={`legend-${item.op}`}
              type="button"
              onClick={() => { setOp(item.op); touch(); }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                item.op === op
                  ? 'border-blue-300 bg-blue-100 text-blue-800 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-200'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              aria-label={`Usar operador ${item.label}`}
            >
              <span className="font-bold tabular-nums">{item.op}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{active.label}:</span> {active.desc}
        </p>
      </div>
    </div>
  );
};

export default OperadoresComparacionSimulator;
