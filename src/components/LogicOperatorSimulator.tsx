import React, { useCallback, useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';

export type ComparisonOperator = '=' | '>' | '<' | '>=' | '<=' | '<>';

export interface OperatorOption {
  op: ComparisonOperator;
  label: string;
  jsLabel: string;
  description: string;
}

export const COMPARISON_OPERATOR_OPTIONS: OperatorOption[] = [
  {
    op: '=',
    label: '=',
    jsLabel: 'Igual a (==)',
    description: 'Comprueba si ambos valores son iguales.',
  },
  {
    op: '>',
    label: '>',
    jsLabel: 'Mayor que (>)',
    description: 'Comprueba si el valor A es estrictamente mayor que el valor B.',
  },
  {
    op: '<',
    label: '<',
    jsLabel: 'Menor que (<)',
    description: 'Comprueba si el valor A es estrictamente menor que el valor B.',
  },
  {
    op: '>=',
    label: '>=',
    jsLabel: 'Mayor o igual (>=)',
    description: 'Verdadero si el valor A es mayor o exactamente igual al valor B.',
  },
  {
    op: '<=',
    label: '<=',
    jsLabel: 'Menor o igual (<=)',
    description: 'Verdadero si el valor A es menor o exactamente igual al valor B.',
  },
  {
    op: '<>',
    label: '<>',
    jsLabel: 'Distinto de (<>)',
    description: 'Verdadero cuando ambos valores son diferentes.',
  },
];

export function evaluateComparison(
  a: number,
  op: ComparisonOperator,
  b: number
): boolean {
  switch (op) {
    case '=':
      return a === b;
    case '>':
      return a > b;
    case '<':
      return a < b;
    case '>=':
      return a >= b;
    case '<=':
      return a <= b;
    case '<>':
      return a !== b;
    default:
      return false;
  }
}

export function parseComparisonNumber(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '-' || trimmed === '.' || trimmed === '-.') {
    return 0;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}

export interface LogicOperatorSimulatorProps {
  onInteract?: () => void;
  className?: string;
  initialNum1?: string;
  initialNum2?: string;
  initialOperator?: ComparisonOperator;
}

/**
 * Simulador interactivo de operadores de comparación lógicos para Excel (=, >, <, >=, <=, <>).
 * Reemplaza al antiguo embed iframe para renderizarse de forma nativa dentro de la lección.
 */
export const LogicOperatorSimulator: React.FC<LogicOperatorSimulatorProps> = ({
  onInteract,
  className = '',
  initialNum1 = '5',
  initialNum2 = '3',
  initialOperator = '=',
}) => {
  const [rawNum1, setRawNum1] = useState<string>(initialNum1);
  const [rawNum2, setRawNum2] = useState<string>(initialNum2);
  const [operator, setOperator] = useState<ComparisonOperator>(initialOperator);

  const val1 = parseComparisonNumber(rawNum1);
  const val2 = parseComparisonNumber(rawNum2);
  const isTrue = evaluateComparison(val1, operator, val2);
  const activeMeta =
    COMPARISON_OPERATOR_OPTIONS.find((item) => item.op === operator) ??
    COMPARISON_OPERATOR_OPTIONS[0];

  const handleNum1Change = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRawNum1(e.target.value);
      onInteract?.();
    },
    [onInteract]
  );

  const handleNum2Change = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRawNum2(e.target.value);
      onInteract?.();
    },
    [onInteract]
  );

  const handleSelectOperator = useCallback(
    (nextOp: ComparisonOperator) => {
      setOperator(nextOp);
      onInteract?.();
    },
    [onInteract]
  );

  const handleReset = useCallback(() => {
    setRawNum1(initialNum1);
    setRawNum2(initialNum2);
    setOperator(initialOperator);
  }, [initialNum1, initialNum2, initialOperator]);

  return (
    <section
      aria-label="Simulador de operadores de comparación"
      data-testid="logic-operator-simulator"
      className={`w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 sm:p-6 space-y-5 ${className}`}
    >
      {/* Encabezado */}
      <header className="relative text-center space-y-1.5">
        <div className="flex items-center justify-center">
          <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">
            Categoría 2 · Laboratorio Lógico
          </p>
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
          Operadores de{' '}
          <span className="text-blue-600 dark:text-blue-400">Comparación</span>
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
          Comparan dos valores y devuelven{' '}
          <span className="font-bold text-emerald-700 dark:text-emerald-400">VERDADERO</span>{' '}
          o{' '}
          <span className="font-bold text-red-700 dark:text-red-400">FALSO</span>. Son la base de{' '}
          <code className="rounded-md bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
            SI()
          </code>
          .
        </p>
        <button
          type="button"
          onClick={handleReset}
          title="Restablecer valores iniciales"
          className="sm:absolute sm:right-0 sm:top-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-h-[36px]"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Reiniciar</span>
        </button>
      </header>

      {/* Panel central interactivo */}
      <div className="rounded-2xl border border-blue-200/90 dark:border-blue-900/60 bg-gradient-to-b from-[#f8fbff] to-[#eef5ff] dark:from-slate-900 dark:to-slate-950/90 p-5 sm:p-7 shadow-sm flex flex-col items-center gap-6">
        {/* Escenario de comparación: [Valor A] (Operador) [Valor B] */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center gap-1.5">
            <input
              type="number"
              step="any"
              value={rawNum1}
              onChange={handleNum1Change}
              aria-label="Primer valor a comparar"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#f05a5b] focus:bg-[#dc2626] border-2 border-transparent focus:border-white text-white text-3xl sm:text-4xl font-extrabold text-center font-mono tabular-nums shadow-md outline-none focus-visible:ring-4 focus-visible:ring-red-500/30 transition-transform duration-150 hover:-translate-y-0.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              Valor A
            </span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div
              aria-live="polite"
              className="w-14 h-14 sm:w-[70px] sm:h-[70px] rounded-full bg-blue-600 dark:bg-blue-500 text-white text-2xl sm:text-3xl font-bold font-mono flex items-center justify-center shadow-md transition-transform duration-150"
            >
              {operator}
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Operador
            </span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <input
              type="number"
              step="any"
              value={rawNum2}
              onChange={handleNum2Change}
              aria-label="Segundo valor a comparar"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#f05a5b] focus:bg-[#dc2626] border-2 border-transparent focus:border-white text-white text-3xl sm:text-4xl font-extrabold text-center font-mono tabular-nums shadow-md outline-none focus-visible:ring-4 focus-visible:ring-red-500/30 transition-transform duration-150 hover:-translate-y-0.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              Valor B
            </span>
          </div>
        </div>

        {/* Botones de selección de operador */}
        <div
          role="group"
          aria-label="Seleccionar operador de comparación"
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 w-full"
        >
          {COMPARISON_OPERATOR_OPTIONS.map((item) => {
            const active = operator === item.op;
            return (
              <button
                key={item.op}
                type="button"
                aria-pressed={active}
                onClick={() => handleSelectOperator(item.op)}
                className={`min-w-[76px] sm:min-w-[92px] min-h-[44px] px-4 py-2 rounded-xl border text-base sm:text-lg font-bold font-mono whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  active
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-4 ring-blue-600/20'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Área de resultado dinámico */}
        <div aria-live="polite" className="flex flex-col items-center gap-2.5 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Resultado de{' '}
            <span className="font-mono text-sm text-blue-600 dark:text-blue-400 tabular-nums normal-case">
              ={val1}
              {operator}
              {val2}
            </span>
          </p>
          <div
            className={`min-w-[192px] min-h-[48px] px-7 py-2.5 rounded-xl text-lg font-extrabold tracking-wide text-white inline-flex items-center justify-center gap-2 shadow-md transition-colors duration-200 ${
              isTrue
                ? 'bg-[#16A34A] dark:bg-emerald-600'
                : 'bg-[#DC2626] dark:bg-red-600'
            }`}
          >
            {isTrue ? (
              <>
                <Check className="w-5 h-5 stroke-[3]" aria-hidden="true" />
                <span>VERDADERO</span>
              </>
            ) : (
              <>
                <X className="w-5 h-5 stroke-[3]" aria-hidden="true" />
                <span>FALSO</span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md">
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {activeMeta.jsLabel}:
            </span>{' '}
            {activeMeta.description}{' '}
            <span className="font-mono text-[11px] text-blue-700 dark:text-blue-300">
              =SI({val1}
              {operator}
              {val2}; &quot;Cumple&quot;; &quot;No cumple&quot;) → &quot;
              {isTrue ? 'Cumple' : 'No cumple'}&quot;
            </span>
          </p>
        </div>
      </div>

      {/* Leyenda inferior de 6 tarjetas interactivas */}
      <footer
        aria-label="Explicación de operadores"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5"
      >
        {COMPARISON_OPERATOR_OPTIONS.map((item) => {
          const active = operator === item.op;
          return (
            <button
              key={item.op}
              type="button"
              onClick={() => handleSelectOperator(item.op)}
              title={item.description}
              className={`rounded-xl border p-3 text-center flex flex-col items-center justify-center gap-1 min-h-[76px] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                active
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600'
              }`}
            >
              <span className="text-xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                {item.label}
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                {item.jsLabel}
              </span>
            </button>
          );
        })}
      </footer>
    </section>
  );
};
